import { Component, Input, ViewChild, Output, EventEmitter, OnChanges, SimpleChanges, HostListener } from '@angular/core';
import { BackendService } from '../backend/backend.service';
import { MatTableDataSource, MatPaginator, MatSort, MatRow } from '@angular/material';
import { FieldConfig } from '../../dynamic-forms/field.interface';
import { formViewParams } from '../form/form-view.component';
import { AuthService } from 'app/gorico/login-page/auth.service';
import { ToastService } from 'app/gorico/services/toast.service';
import { ReportService } from 'app/gorico/services/report.service';
import { NgxPubSubService } from '@pscoped/ngx-pub-sub';

export interface tableViewParams {
    entryName: string;
    keys: any;
    showHeader: boolean;
    showFullScreenButton: boolean;
    outputEvent?: any;
}

export type tableDataType = 'text' | 'date' | 'number' | 'boolean';

export interface tableViewKey { // as per API specification
    isHidden: boolean;
    isPrimary: boolean;
    key: string;
    label: string;
    queryFunct?: string;
    format: {
        dataType: tableDataType,
        value?: any
    };
}

export interface searchViewKey { // as per API specification
    fieldName: string;	// form field name, might or not correspond to a postgres column
    newLine: boolean; 	// new line with the next field
    label: string;		// displayed key name
    queryCond: string; 	// postgres query condition (after WHERE clause), mandatory to link w/ a Postgres column
    format: {		//  DataFormat type
        viewType: string; 		// form view type, one among “input” | “combobox” | “checkbox” | “radiobutton” 
        dataType?: string; 				//  only if viewtype=”input”
        value?: any;  		// default value
        options?: [					// in caseof combobox | radiobutton
            {
                id: number,			// combobox entry ID
                name: string			// displayed entry value
            }];
        comboQuery?: string,		// combobox query, returns an array of [{“id”: Number, “name”: String}]
    }
}

@Component({
    selector: 'table-view',
    templateUrl: './table-view.component.html',
    styleUrls: ['./table-view.component.scss']
})



export class TableViewComponent implements OnChanges {

    // is Current Tab
    @Input() isTabMode: boolean = false;
    @Input() isCurTab: boolean = false;

    @Input() tableData: tableViewParams;
    @Output() sendEvent = new EventEmitter<any>();
    @Output() onReload = new EventEmitter<any>();

    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;

    quickAddFormParams: formViewParams = {
        entryName: '',
        keys: {},
        index: 1,
        total: 1,
        isNew: true,
        showNavBar: false
    };

    showQuickAdd = false;

    showAdvSearch = false;

    searchData: FieldConfig[];

    searchOptions = []; // search options for comboboxes

    displayedColumns: string[];

    dataSource: MatTableDataSource<any> = null;
    selectedRow: MatRow = null;
    isLoading = true;

    isFullScreen = false;

    viewKeys: tableViewKey[];  // view fields as specified by the backend

    searchKeys: searchViewKey[];

    currentKeys: any; // relevant keys passed by the parent component 

    keysArray: any[];  // list of primary keys values, one entry for each table row

    targetEntryName: string; // target form view table, might be different from 'self'

    // Height available for table
    tableHeight = 1000;

    // toolbar pub/sub topics
    subMsgCmdTopic = '/toolbar/out/cmd';
    pubMsgCmdTopic = '/toolbar/in/cmd';

    constructor(
        private backendService: BackendService,
        private authService: AuthService,
        private _pubSubService: NgxPubSubService,
        private _toastService: ToastService,
        private _reportService: ReportService,
    ) {

        this.calculateTableHeight();
    }

    ngOnChanges(changes: SimpleChanges): void {
        let _this = this;
        console.log(`isCurTab: ${_this.isCurTab}`);

        if (changes.tableData) {
            _this.quickAddFormParams.entryName = _this.tableData.entryName;
            _this.quickAddFormParams.keys = _this.tableData.keys;

            console.table({ data: _this.tableData, change: 'tableData', tableData: _this.tableData ? true : false, isTabMode: _this.isTabMode, isCurTab: _this.isCurTab });

            // Check if it is main table
            if (!_this.isTabMode) {
                // Load main table data
                this.loadData();

                // Request to load reports
                // _this._pubSubService.publishEvent(_this.pubMsgCmdTopic, { type: 'print_list' });
                _this._reportService.requestReload(_this.tableData.entryName);
            }

            if (_this.isTabMode && _this.isCurTab) {
                this.loadData();
            }
        }
        else if (changes.isCurTab) {
            console.log("inside table-view isCurTab changes!");

            console.table({ change: 'isCurTab', tableData: _this.tableData ? true : false, isTabMode: _this.isTabMode, isCurTab: _this.isCurTab });

            if (_this.isTabMode && _this.isCurTab) {
                this.loadData();
            }

        }
    }

    public loadData() {
        let _this = this;
        _this.backendService.getView(_this.tableData.entryName, _this.authService.getCurrentCompany(), _this.tableData.keys).subscribe(result => {
            if (result.result === 'OK' && result.data != null && result.data.table_keys != null) {
                const params = result.data;
                console.table(params);
                _this.viewKeys = params.table_keys;
                _this.searchKeys = params.search_keys;
                _this.targetEntryName = (params.navigationTarget != null) ? params.navigationTarget : _this.tableData.entryName; // self or new form table?
                _this.displayedColumns = _this.getColumnLabels(_this.viewKeys);
                _this.currentKeys = _this.getCurrentKeys(_this.viewKeys, _this.tableData.keys);
                _this.sendEvent.emit({ eventType: 'currentTableKeys', queryParams: { keys: _this.currentKeys } }); // pass current keys to parent view 
                _this.loadTable(null);
            }
            else {
                _this.isLoading = false;
                // Show error snackbar
                _this._toastService.showErrorToast(result.reason);
            }
        });
        // Calculate table height
        this.calculateTableHeight();
    }

    loadTable(search_keys: any): void {
        const _this = this;
        _this.backendService.getData(_this.tableData.entryName, _this.authService.getCurrentCompany(), _this.currentKeys, search_keys, false, false, null, false).subscribe(
            results => {
                console.log(results);
                if (results.result === 'OK') {
                    results = results.data;
                    if (results.search_options) { // got some search combobox options
                        _this.searchOptions = results.search_options; // store them
                        results = results.table_data; // and get the table data
                    }
                    _this.searchData = _this.getSearchData(_this.searchKeys);
                    _this.dataSource = new MatTableDataSource(results);
                    _this.dataSource.sort = _this.sort;
                    _this.dataSource.paginator = _this.paginator;
                    // triggers any change in displayed datasource, setting the array of primary keys
                    _this.dataSource.connect().subscribe(source => {
                        _this.keysArray = source.map(row => {
                            const key_values = {};
                            const primaryKeys = _this.viewKeys.filter(entry => {
                                return entry.isPrimary;
                            });
                            for (const primaryKey of primaryKeys) {
                                key_values[primaryKey.key] = row[primaryKey.key];
                            }
                            return key_values;
                        });
                    });
                    _this.isLoading = false;
                }
                else {
                    // Show error snackbar
                    _this._toastService.showErrorToast(results.reason);
                }
            },
            error => {
                _this.isLoading = false;
            });

        // Calculate table height
        this.calculateTableHeight();
    }

    private getSearchData(searchKeys: searchViewKey[]): FieldConfig[] {
        let _this = this;
        let fieldValues: FieldConfig[] = [];

        if (!searchKeys) {
            return fieldValues;
        }

        searchKeys.forEach(field => {
            let fieldValue: FieldConfig;
            let searchEntry = _this.searchOptions ? _this.searchOptions.find(e => e.fieldName === field.fieldName) : null;
            let options = [];
            if (searchEntry) {
                options = searchEntry.options;
            }
            fieldValue = {
                label: field.label,
                name: field.fieldName,
                value: null,
                type: field.format.viewType,
                inputType: field.format.dataType ? field.format.dataType : '',
                newLine: field.newLine ? field.newLine : true,
                options: options,
                validations: []
            };
            fieldValues.push(fieldValue);
        });

        return fieldValues;

    }

    advSearch() {
        this.showAdvSearch = !this.showAdvSearch;
    }

    quickAdd(): void {
        this.showQuickAdd = !this.showQuickAdd;
    }

    search_submit(value: any) {
        console.log(value);
        // clean-up null or empty values
        let cleanedValues = {};
        for (const key in value) {
            if (value.hasOwnProperty(key)) {
                const element = value[key];
                if (element && element !== '') {
                    cleanedValues[key] = element.id ? element.id : element;
                }
            }
        }
        this.loadTable(cleanedValues);
        this.sendEvent.emit({ eventType: 'searchKeys', queryParams: { keys: cleanedValues } }); // pass search keys to parent view 
    }

    cancel_search() {
        this.showAdvSearch = false;
        this.loadTable(null);
        this.sendEvent.emit({ eventType: 'searchKeys', queryParams: { keys: null } }); // pass search keys to parent view 
    }

    cancel(): void {
        this.showQuickAdd = false;
    }

    applyFilter(filterValue: string) {
        if (this.dataSource && this.dataSource.data && this.dataSource.data.length) {
            filterValue = filterValue.trim(); // Remove whitespace
            filterValue = filterValue.toLowerCase(); // Datasource defaults to lowercase matches
            this.dataSource.filter = filterValue;
            if (this.dataSource.paginator) {
                this.dataSource.paginator.firstPage();
            }
        }
    }

    getRecord(index: number, row: MatRow) {
        this.selectedRow = row;
        const mergedParams = { entry: { name: this.targetEntryName, type: 'form' }, keys: this.keysArray, index: index + 1, total: this.keysArray.length };
        setTimeout(() => { this.sendEvent.emit({ eventType: 'navigate', queryParams: mergedParams }); }, 50);
    }


    getColumnLabels(viewKeys: tableViewKey[]) {
        let colLabels = viewKeys.map(c => c.label);
        return colLabels;

    }

    getCurrentKeys(validKeysArray: tableViewKey[], inputKeys: any) {

        let outputKeys = {};
        for (const key in inputKeys) {
            if (inputKeys.hasOwnProperty(key)) {
                const element = inputKeys[key];
                if (validKeysArray.find(e => e.key === key)) {
                    outputKeys[key] = element;
                }

            }
        }

        return outputKeys;
    }

    fullScreen() {

        this.isFullScreen = !this.isFullScreen;
        this.sendEvent.emit({ eventType: 'fullScreen', queryParams: { value: this.isFullScreen } });

        // Calculate table height
        this.calculateTableHeight();
    }

    onEvent(event: any) {
        if (event.eventType === 'savedForm') { // quick add form view submitted the new record
            this.showQuickAdd = false; // hide quick add
            this._toastService.showSuccessToast("Saved successfully!"); // show success toast
            this.loadTable(null); // reload the table to visualize the record
        } else { // forward to parent
            this.sendEvent.emit(event);
        }
    }


    // Get height on resize
    @HostListener('window:resize', ['$event'])
    onResize(event) {
        // Update height available
        this.calculateTableHeight();
    }

    calculateTableHeight() {
        if (!this.tableData || !this.tableData.showFullScreenButton) {
            this.tableHeight = window.innerHeight
                - 64 // Titlebar
                - 36; // Separator
        }
        else if (this.tableData && this.tableData.showFullScreenButton && !this.isFullScreen) {
            this.tableHeight = ((window.innerHeight - 64) * 0.33)
                - 36 // Separator
                - 48; // Tabs
        }
        else {
            this.tableHeight = window.innerHeight
                - 64 // Titlebar
                - 101 // Navibar
                - 48 // Tabs
                - 36 // Full screen button
                - 36; // Quick add button
        }
    }

    reload() {
        console.log('onReload: table-view');
        this.onReload.emit();
    }
}




