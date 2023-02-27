import { Component, Input, ViewChild, Output, EventEmitter, OnChanges, SimpleChanges, HostListener, ViewEncapsulation, OnDestroy, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource, MatRow } from '@angular/material/table';
import { ExportItem, FieldConfig, FormViewParams, ImportItem, MessageElement, MessageView, Restrictions, SearchToggle, SearchViewKey, SelectionAction, TableViewKey, TableViewParams } from 'app/oc/interfaces';
import { Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { SelectionModel } from '@angular/cdk/collections';
import { AuthService, BackendService, ConsoleLoggerService, DialogService, GoogleAPIService, HelperService, ImportExportService, MessagesService, NavigationService, PubSubService, ReportService, TimeTrackerService, ToastService } from 'app/oc/services';
import { DataSharingService } from 'app/oc/services/data_sharing.service';

@Component({
    selector: 'table-view',
    templateUrl: './table-view.component.html',
    styleUrls: ['./table-view.component.scss'],
    encapsulation: ViewEncapsulation.None
})



export class TableViewComponent implements AfterViewInit, OnChanges, OnDestroy {

    private margins = 2; // % of margins, considering left and right

    // is Current Tab
    @Input() isTabMode: boolean = false;
    @Input() isCurTab: boolean = false;

    @Input() tableData: TableViewParams;
    @Output() sendEvent = new EventEmitter<any>();
    @Output() onReload = new EventEmitter<any>();

    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort, { static: false }) sort: MatSort;

    format = {};
    
    quickAddFormParams: FormViewParams = {
        entryName: '',
        keys: {},
        index: 1,
        total: 1,
        isNew: true,
        showNavBar: false,
        navBarMode: 'detail'
    };

    showQuickAdd = false;

    showAdvSearch = false;

    showImportDataButton = false;

    importDataSource: string;

    searchData: FieldConfig[];

    searchOptions = []; // search options for comboboxes

    displayedColumns: string[];

    styles = {};
    dataSource: MatTableDataSource<any> = null;
    hasData: boolean = false;
    selectedRow: MatRow = null;
    isLoading = false;

    isFullScreen = false;

    hideActions: string[] = []; // Hide actions
    importList: ImportItem[] = [];
    exportList: ExportItem[] = [];

    messages: MessageElement[] = []; // Messages
    @Output() onMessagesUpdated: EventEmitter<MessageView[]> = new EventEmitter();

    isAuthorized: boolean = true;
    viewKeys: TableViewKey[];  // view fields as specified by the backend
    completeSearchKeys: SearchViewKey[]; // Also contains search toggles
    advancedSearchKeys: SearchViewKey[]; // Search keys to show Advanced search
    searchToggles: SearchToggle[];
    
    currentKeys: any; // relevant keys passed by the parent component 

    keysArray: any[];  // list of primary keys values, one entry for each table row

    targetEntryName: string; // target form view table, might be different from 'self'

    // Height available for table
    tableHeight = 1000;

    // Level related stuff
    isLevel: string = null;
    hasLevel: string[] = null;
    levelIndentationMarker: string = '.';
    levelIndentationValue: number = 13;

    // toolbar pub/sub topics
    subMsgCmdTopic = '/toolbar/out/cmd';
    pubMsgCmdTopic = '/toolbar/in/cmd';

    // Selection
    selectionActions: SelectionAction[] = [];
    initialSelection: any = [];
    allowMultiSelect = true;
    selection = new SelectionModel<any>(true, []);

    // Restrictions
    restrictions: Restrictions = {
        preventNavigationToForm: false
    };

    /** Whether the number of selected elements matches the total number of rows. */
    isAllSelected() {
        const numSelected = this.selection.selected.length;
        const numRows = (this.dataSource && this.dataSource.data && this.dataSource.data.length)? this.dataSource.data.length: 0;
        return numSelected == numRows;
    }

    /** Selects all rows if they are not all selected; otherwise clear selection. */
    masterToggle() {
        this.isAllSelected() ?
            this.selection.clear() :
            this.dataSource.data.forEach(row => this.selection.select(row));
    }

    /** The label for the checkbox on the passed row */
    checkboxLabel(row?: any): string {
        if (!row) {
        return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
        }
        return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.position + 1}`;
    }

    subscriptions: Subscription[] = [];

    showExplorer = false;
    explorerSource: "table-view" | "google-drive" = "table-view";
    explorerLevelTwoMask: string = null;

    foldersSource: object[] = [];
    folders: string[] = [];
    filesSource: object[] = [];
    files: string[] = [];

    constructor(
        private backendService: BackendService,
        private authService: AuthService,
        private _pubSubService: PubSubService,
        private _toastService: ToastService,
        private _reportService: ReportService,
        private _importExportService: ImportExportService,
        private _navigationService: NavigationService,
        private _messagesService: MessagesService,
        private _dialogService: DialogService,
        private _console: ConsoleLoggerService,
        private httpClient: HttpClient,
        private _timeTrackerService: TimeTrackerService,
        private _googleAPIService: GoogleAPIService,
        private _dataSharingService: DataSharingService,
        private changeDetector : ChangeDetectorRef
    ) {
        // Set selection model
        this.selection = new SelectionModel<any>(this.allowMultiSelect, this.initialSelection);
        
        
        this.calculateTableHeight();
    }

    ngOnChanges(changes: SimpleChanges): void {
        const _this = this;
        _this._console.log(`isCurTab: ${_this.isCurTab}`);

        if (changes.tableData) {
            _this.quickAddFormParams.entryName = _this.tableData.entryName;
            _this.quickAddFormParams.keys = _this.tableData.keys;

            _this._console.table({ data: _this.tableData, change: 'tableData', tableData: _this.tableData ? true : false, isTabMode: _this.isTabMode, isCurTab: _this.isCurTab });

            // Check if it is main table
            if (!_this.isTabMode) {
                // Load main table data
                _this.loadData(_this.tableData.searchKeys);

                if(!_this._reportService.isLazyLoadingEnabled || _this._reportService.cache[_this.tableData.entryName]) {
                    // Request to load reports
                    // _this._pubSubService.publishEvent(_this.pubMsgCmdTopic, { type: 'print_list' });
                    _this._reportService.requestReload(_this.tableData.entryName);
                    // _this._importExportService.requestReload(_this.tableData.entryName);
                }
                else {
                    _this._reportService.prepareLazyLoad(_this.tableData.entryName);
                }
            }

            if (_this.isTabMode && _this.isCurTab) {
                _this.loadData();
            }
        }
        else if (changes.isCurTab) {
            _this._console.log('inside table-view isCurTab changes!');

            _this._console.table({ change: 'isCurTab', tableData: _this.tableData ? true : false, isTabMode: _this.isTabMode, isCurTab: _this.isCurTab });

            if (_this.isTabMode && _this.isCurTab) {
                _this.loadData();
            }

        }
    }

    ngAfterViewInit() {
        let _this = this;
        
        if(_this.isTabMode){
            _this.subscriptions.push(_this._navigationService.onBottomTabRefreshRequested.subscribe( (value) => {
                if(_this.isCurTab) {
                    _this.loadData();
                }
            }));
        }
    }

    ngOnDestroy() {
        this.subscriptions.forEach(element => {
            element.unsubscribe();
        });
    }

    public resetView(search_keys = null) {
        this.showQuickAdd = false;
        this.showAdvSearch = false;

        this.viewKeys = null;
        this.completeSearchKeys = null;
        this.advancedSearchKeys = null;
        // this.searchToggles = null;
        this.displayedColumns = null;
        this.currentKeys = null;

        this.searchOptions = null;
        this.searchData = null;
        this.dataSource = null;

        this.sendEvent.emit({ eventType: 'searchKeys', queryParams: { keys: search_keys } }); // pass search keys to parent view 
    
    }

    public resetSelection() {
        this.selection.clear();
    }

    public loadPaginationAndSort() {
        if(this.dataSource && this.dataSource.data) {
            if(this.sort) {
                this.dataSource.sort = this.sort;
            }
            if(this.paginator) {
                this.dataSource.paginator = this.paginator;
            }
        }
    }

    public onPaginatorChange($event: Event): void {
        this.loadPaginationAndSort();
    }
    
    public onTableChange($event: Event): void {
        this.loadPaginationAndSort();
    }
 
    public loadData(search_keys = null) {
        const _this = this;
        _this.resetView(search_keys);
        _this.resetSelection();
        _this.isLoading = true;
        _this.subscriptions.push(_this.backendService.getView(_this.tableData.entryName, _this.authService.getCurrentCompany(_this.currentKeys), _this.tableData.keys).subscribe(
            result => {
                if (result.result === 'OK' && result.data != null && result.data.table_keys != null) {
                    _this.showImportDataButton = result.externalUpdate != null;
                    _this.importDataSource = result.externalUpdate;
                    const params = result.data;
                    _this._console.table(params);
                    _this.loadRestrictions(params.restrictions);
                    _this.loadSelectionActions(params.table_multiselection_actions);
                    _this.loadViewKeys(params.table_keys);
                    _this.completeSearchKeys = params.search_keys;
                    _this.updateAdvancedSearchKeys(params.search_keys);
                    _this.loadSearchToggles(params.search_keys, search_keys);
                    _this.targetEntryName = (params.navigationTarget != null) ? params.navigationTarget : _this.tableData.entryName; // self or new form table?
                    _this.displayedColumns = _this.getColumnLabels(_this.viewKeys);
                    _this.currentKeys = _this.getCurrentKeys(_this.viewKeys, _this.tableData.keys);
                    _this.sendEvent.emit({ eventType: 'currentTableKeys', queryParams: { keys: _this.currentKeys } }); // pass current keys to parent view 
                    if(result.data.explorerOptions && result.data.explorerOptions.showExplorerView) {
                        _this.showExplorer = true;
                    }
                    else {
                        _this.showExplorer = false;
                    }

                    if(result.data.explorerOptions && result.data.explorerOptions.levelTwoMask) {
                        _this.explorerLevelTwoMask = result.data.explorerOptions.levelTwoMask;
                    }
                    else {
                        _this.explorerLevelTwoMask = 'folders_list_liv2';
                    }
                    
                    if(result.data.explorerOptions && result.data.explorerOptions.explorerSource) {
                        _this.explorerSource = result.data.explorerOptions.explorerSource;
                    }
                    else {
                        _this.explorerSource = 'table-view';
                    }
                    if(_this.explorerSource != 'google-drive') {
                        _this.loadTable(search_keys);
                    }
                    else {
                        _this.loadDriveContents();
                    }
                    
                    _this._console.log(_this.viewKeys);
                    
                    const key_values = {};
                    const primaryKeys = _this.viewKeys.filter(entry => {
                        return entry.isPrimary;
                    });
                    // for (const primaryKey of primaryKeys) {
                    //     key_values[primaryKey.key] = row[primaryKey.key];
                    // }
                    // return key_values;

                    
                    _this.loadStyle(params.table_keys);
                    _this.loadLevel(params.table_keys);
                    _this.loadFormat(params.table_keys);
                    // signal toolbar about a dashboard 
                    _this._navigationService.onDashboardTableLoad.emit({origin: _this.tableData.entryName, dashboardTables: params.dashboardTables});

                    // Load Messages if available
                    if (params.messages) {
                        _this.messages = _this._messagesService.getTableMessages(params.messages);
                    }
                    else {
                        _this.messages = [];
                    }

                    // Load Hide Actions if available
                    _this.hideActions = _this._navigationService.getTableHideActions(params.hideActions);
                    if(params.profileHideActions) {
                        _this.hideActions = _this.hideActions.concat(params.profileHideActions);
                    }

                    
                    // Load Import Queries list if available
                    if (params.importQueries && params.importQueries.tableQueries) {
                        _this.importList = params.importQueries.tableQueries;
                    }
                    else {
                        _this.importList = [];
                    }

                    // Load Export Queries list if available
                    if (params.exportQueries && params.exportQueries.tableQueries) {
                        _this.exportList = params.exportQueries.tableQueries;
                    }
                    else {
                        _this.exportList = [];
                    }

                    if (!_this.isTabMode){
                        // Propogate Import Queries list if available
                        if (params.importQueries && params.importQueries.tableQueries) {
                            _this._console.log('importQueries', params.importQueries);
                            _this._importExportService.updateImportList(_this.tableData.entryName, params.importQueries.tableQueries);
                        }
                        else {
                            _this._importExportService.updateImportList(_this.tableData.entryName, []);
                        }

                        // Propogate Export Queries list if available
                        if (params.exportQueries && params.exportQueries.tableQueries) {
                            _this._console.log('exportQueries', params.exportQueries);
                            _this._importExportService.updateExportList(_this.tableData.entryName, params.exportQueries.tableQueries);
                        }
                        else {
                            _this._importExportService.updateExportList(_this.tableData.entryName, []);
                        }

                        // Load Hide actions if available
                        _this._navigationService.updateToolbarHideActions(_this.hideActions);
                        
                        _this.onMessagesUpdated.emit(params.messages);
                    }
                }
                else {
                    _this.isLoading = false;
                    // Show error snackbar
                    _this._toastService.showErrorToast("Error ",JSON.stringify(result.reason.detail));
                }
            },
            error => {
                _this.isLoading = false;
                // Show error snackbar
                _this._toastService.showErrorToast("Error ",JSON.stringify(error));
            }
        ));
        // Calculate table height
        _this.calculateTableHeight();
    }

    loadTableInfo(): void {
        const _this = this;
        
       // _this.loadTable(null);

        /*                                       Don't use it fro now, see and find the problem. 

        The problem is in the define of searchKeys, for example in Progetti -> advSearch, if we try to select a "Modelli di Progetto" nothing appears.

        */

        /*
            No need to use this function anymore since I (Zee) fixed the search keys stuff in SearchRequest. 
        */
       
        _this.subscriptions.push(_this.backendService.getData(_this.tableData.entryName, _this.authService.getCurrentCompany(_this.currentKeys), _this.currentKeys, null, false, false, null, false).subscribe(
            results => {
                _this._console.log(results);
                if (results.result === 'OK') {
                    _this.showAdvSearch = false;
                    results = results.data;
                    if (results.search_options) { // got some search combobox options
                        _this.searchOptions = results.search_options; // store them
                    }
                    _this.searchData = _this.getSearchData(_this.advancedSearchKeys);
                    _this.loadTable(null);
                  }
            },
            error => {
                _this.isLoading = false;
                _this._toastService.showErrorToast("Error ",JSON.stringify(error));
            })); 
       }
     

    loadTable(search_keys: any): void {
        const _this = this;
        _this.isLoading = true;
        _this.hasData = false;

        // Add search toggles if exist
        search_keys = _this.applySearchToggles(search_keys);
        search_keys = _this.applyHomepageKeys(search_keys);

        _this.subscriptions.push(_this.backendService.getData(_this.tableData.entryName, _this.authService.getCurrentCompany(_this.currentKeys), _this.currentKeys, search_keys, false, false, null, false).subscribe(
            results => {
                _this._console.log(results);
                if (results.result === 'OK') {
                    _this.showAdvSearch = false;
                    results = results.data;
                    if (results.search_options) { // got some search combobox options
                        _this.searchOptions = results.search_options; // store them
                        results = results.table_data; // and get the table data
                    }
                    _this.searchData = _this.getSearchData(_this.advancedSearchKeys);
                    if(_this.showExplorer) {
                        _this.loadExplorerData(results);
                    }

                    _this.dataSource = new MatTableDataSource(results);
                    _this.dataSource.sort = _this.sort;
                    if(_this.paginator) {
                        _this.dataSource.paginator = _this.paginator;
                    }
                    
                    // triggers any change in displayed datasource, setting the array of primary keys
                    _this.subscriptions.push(_this.dataSource.connect().subscribe(source => {
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
                    }));
                    _this.hasData = results && results.length > 0;
                    _this.changeDetector.detectChanges();
                    _this.isLoading = false;
                }
                else {
                    if(results.reason === 'Not Authorized') {
                        _this._console.log('Not Authorized');
                        _this.isAuthorized = false;
                    }
                    else {
                        // Show error snackbar
                        _this._toastService.showErrorToast("Error ",JSON.stringify(results.reason.detail));
                    }
                }

                _this.isLoading = false;
            },
            error => {
                _this.isLoading = false;
                _this._toastService.showErrorToast("Error ",JSON.stringify(error));
            }));

        // Calculate table height
        this.calculateTableHeight();
    }

    loadLevel(table_keys) {
        this.isLevel = null;
        this.hasLevel = null;

        table_keys.forEach(key => {
            if (key.isLevel) {
                if (!this.isLevel) {
                    this.isLevel = key.key;
                }
                else {
                    this._console.error('More than one isLevel key defined!');
                }
            }
            else if (key.hasLevel) {
                if (!this.hasLevel) {
                    this.hasLevel = [];
                }
                this.hasLevel.push(key.key);
            }
        });

        this._console.log('isLevel', this.isLevel);
        this._console.log('hasLevel', this.hasLevel);
    }

    loadFormat(table_keys: TableViewKey[]) {
        if(table_keys && table_keys.length) {
            this.format = {};
            table_keys.forEach(viewKey => {
                this.format[viewKey.key] = {
                    dataType: viewKey.format.dataType,
                    pipe: viewKey.format.pipe
                }
            })
        }
    }

    getLevel(row, key) {
        if (this.isLevel == key || (this.hasLevel && this.hasLevel.includes(key)) ) {
            let text = row[this.isLevel] ? row[this.isLevel].split(this.levelIndentationMarker) : null;
            return text ? (text.length -1) * this.levelIndentationValue : this.levelIndentationValue;
        }
        else {
            return 0;
        }
    }

    loadStyle(table_keys) {
        let _this = this;
        _this.styles = {};
        table_keys.forEach(key => {
            if (key.style && key.style.length) {
                key.style.forEach(style => {
                    if (!_this.styles[key.key]) {
                        _this.styles[key.key] = {};
                    }
                    _this.styles[key.key][style.value] = style;
                });
            }
        });
    }

    doesButtonIconExist(key: string) {
        const keys = Object.keys(this.styles[key]);
        let buttonIconExists = false;

        keys.forEach(k => {
            if(this.styles[key][k]['button_icon']) {
                buttonIconExists = true;
            }
        })
        return buttonIconExists;
    }

    getButtonIcon(key: string, value) {
        return (this.styles[key][value] ?? this.styles[key]['*'] ?? this.styles[key])['button_icon'];
    }

    getElementStyle(column, value) {
        let styles = {};
        const styleKeysToIgnore = ['value', 'button_icon'];

        const valueStr = value != null? value + '': null;
        if (column && valueStr && this.styles[column]) {
            let values: string[] = Object.keys(this.styles[column]);
            if (valueStr && values.includes(valueStr)) {
                Object.keys(this.styles[column][valueStr]).forEach(key => {
                    if (!styleKeysToIgnore.includes(key)) {
                        styles[HelperService.getStyleName(key)] = this.styles[column][valueStr][key];
                    }
                });
            }
            else if (values.includes('*')) {
                Object.keys(this.styles[column]['*']).forEach(key => {
                    if (!styleKeysToIgnore.includes(key)) {
                        styles[HelperService.getStyleName(key)] = this.styles[column]['*'][key];
                    }
                });
            }

        }
        return styles;
    }

    private loadRestrictions(restrictions: Restrictions) {
        if(restrictions && Object.keys(restrictions).length > 0) {
            this.restrictions = restrictions;            
        }
        else {
            this.restrictions = {
                preventNavigationToForm: false
            };
        }
    }

    private loadSelectionActions(actions: SelectionAction[]) {
        if(actions && actions.length) {
            this.selectionActions = actions.map( x => {
                return {
                    viewType: x.viewType,
                    key: x.key,
                    label: x.label,
                    icon: x.icon,
                    menuOptions: x.menuOptions,
                    confirmAction: x.confirmAction,
                    reloadOnSuccess: x.reloadOnSuccess,
                    confirmActionMessage: x.confirmActionMessage
                }
            });
        }
        else {
            this.selectionActions = null;
        }
    }

    private loadViewKeys(table_keys: any[]) {
        if(this.selectionActions && this.selectionActions.length) {
            let selectTableKey: TableViewKey = {
                format: {dataType: 'checkbox'},
                isHidden: false,
                isPrimary: false,
                isSelectCheckbox: true,
                key:'selectCheckbox',
                label:'Select Checkbox'
            };
            this.viewKeys = [selectTableKey].concat(table_keys);    
        }
        else {
            this.viewKeys = table_keys;
        }
    }

    private getSearchData(searchKeys: SearchViewKey[]): FieldConfig[] {
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
                tooltip: field.tooltip,
                name: field.fieldName,
                value: null,
                type: field.format.viewType,
                inputType: field.format.dataType ? field.format.dataType : '',
                newLine: field.newLine !== null ? field.newLine : true,
                options: options,
                validations: [],
                isVisible: true,
                width: null
            };
            fieldValues.push(fieldValue);
        });

        _this.process_form_row(fieldValues, _this.margins);
        return fieldValues;

    }

    advSearch() {
        this.showAdvSearch = !this.showAdvSearch;
    }

    updateAdvancedSearchKeys(searchKeys: SearchViewKey[]) {
        if(searchKeys && searchKeys.length > 0) {
            this.advancedSearchKeys = searchKeys.filter(x => x.format.viewType != 'toggle');
        }
        else {
            this.advancedSearchKeys = [];
        }
    }

    loadSearchToggles(completeSearchKeys: SearchViewKey[], searchKeys: any = null) {
        if(completeSearchKeys && completeSearchKeys.length > 0) {
            this.searchToggles = completeSearchKeys.filter(x => x.format.viewType == 'toggle').map( x => {
                let checked = false;
                if(searchKeys && Object.keys(searchKeys).includes(x.fieldName)) {
                    checked = searchKeys[x.fieldName];
                }
                else {
                    checked = (x.format.value == 'true' || x.format.value == true || x.format.value == '1' || x.format.value == 1) ? true: false;
                }
                return {
                    fieldName: x.fieldName,
                    label: x.label,
                    tooltip: x.tooltip,
                    checked: checked
                };
            });

            this.searchToggles;
        }
        else {
            this.searchToggles = [];
        }
    }

    updateSearchToggle(index: number, checked: boolean) {
        let cleanedValues={};
        this.searchToggles[index].checked = checked;
        // this.search_submit({});
        this.searchToggles.forEach( x => {
            cleanedValues[x.fieldName] = x.checked
        });
        const newTableParams: any = {
            entry:  {
                name: this.tableData.entryName,
                type: 'table'
            },
            keys: this.tableData.keys,
            searchKeys: cleanedValues
            
        }
        this.navigate(newTableParams);
    }
    
    applySearchToggles(cleanedValues: any) {
        // Apply toggles
        if(this.searchToggles && this.searchToggles.length) {
            // clean-up null or empty values
            if(!cleanedValues) {
                cleanedValues = {};
            }
        
            this.searchToggles.filter(x => x.checked).forEach( x => {
                cleanedValues[x.fieldName] = x.checked
            });
        }

        return cleanedValues;
    }

    applyHomepageKeys(cleanedValues: any) {
        let keys = this._dataSharingService.getData('homepageSearchKeys');
        // Apply toggles
        if(keys && Object.keys(keys).length) {
            // clean-up null or empty values
            if(!cleanedValues) {
                cleanedValues = {};
            }
        
            cleanedValues = {
                ...cleanedValues,
                ...keys
            }

            this._dataSharingService.clearData('homepageSearchKeys');
        }

        return cleanedValues;
    }

    quickAdd(): void {
        this.showQuickAdd = !this.showQuickAdd;
    }

    add() {
        let keys = {};
        this.viewKeys.filter(x => x.isPrimary).forEach(x => {
            if(this.tableData.keys && this.tableData.keys[x.key]) {
                keys[x.key] = this.tableData.keys[x.key];
            }
            // else if(this.keysArray && this.keysArray.length && this.keysArray[0][x.key]) {
            //     keys[x.key] = this.keysArray[0][x.key];
            // }
        });
        Object.keys(this.currentKeys).forEach( key => {
            keys[key] = this.currentKeys[key];
        });

        
        const mergedParams = { entry: { name: this.targetEntryName, type: 'form' }, keys: keys, index: 0, total: 0 };
        setTimeout(() => { this.sendEvent.emit({ eventType: 'add', queryParams: mergedParams }); }, 50);    
    }

    search_submit(value: any) {
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

        // New Logic, navigate to a new table view page with same params but with search Keys
        const newTableParams: any = {
            entry:  {
                name: this.tableData.entryName,
                type: 'table'
            },
            keys: this.tableData.keys,
            searchKeys: cleanedValues
            
        }
        this.navigate(newTableParams);

        // Old logc, load current table with search Keys 
        // this.loadTable(cleanedValues);
        // this.sendEvent.emit({ eventType: 'searchKeys', queryParams: { keys: cleanedValues } }); // pass search keys to parent view 
    }

    cancel_search() {
        this.showAdvSearch = false;
        this.loadSearchToggles(this.completeSearchKeys);
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

    skipGetRecord = false;
    getRecord(index: number, row: MatRow) {
        if(!this.restrictions || !this.restrictions.preventNavigationToForm) {
            if(!this.skipGetRecord){
                this.selectedRow = row;
                const mergedParams = { entry: { name: this.targetEntryName, type: 'form' }, keys: this.keysArray, index: index + 1, total: this.keysArray.length };
                this.navigate(mergedParams);
            }
            else {
                this.skipGetRecord = false;
            }
        }
    }

    loadExplorerData(results: any) {
     let _this = this;
     _this.foldersSource = results;
     _this.folders = results.map(x => x.folder_name);
     
     _this.keysArray = results.map(row => {
         const key_values = {};
         const primaryKeys = _this.viewKeys.filter(entry => {
             return entry.isPrimary;
         });
         for (const primaryKey of primaryKeys) {
             key_values[primaryKey.key] = row[primaryKey.key];
         }
         return key_values;
     });

    }

    goInside(index: number, row: any) {
        if(!this.restrictions || !this.restrictions.preventNavigationToForm) {
            if(this.explorerSource == 'table-view') {
                // table-view
                if('' + row.id_risorsa == '0'){
                    this.selectedRow = row;
                    this.currentKeys = row;
                    // this.currentKeys.liv++;
                    this.tableData.entryName = this.explorerLevelTwoMask;
                    // this.loadTable(null);
                    const mergedParams = { entry: { name: this.tableData.entryName, type: 'explorer' }, keys: row, index: index + 1, total: this.keysArray.length };
                    this.navigate(mergedParams);
                }
                else {
                    // Do nothing, cannot go inside further
                }
            }
            else {
                // google drive mode
                this.loadDriveContents(this.foldersSource[index]['id']);
            }

            
        }
    }


    onButtonClick(key: string, index: number, row: MatRow) {
        let _this = this;
        _this.skipGetRecord = true;
        let selectedViewKey: TableViewKey = _this.viewKeys.filter(x => x.key == key)[0];

        if(selectedViewKey && selectedViewKey.buttonAction) {
            if(selectedViewKey.buttonAction.confirmAction) {
                let confirmMessage: {title: string, text: string} = {
                    title: selectedViewKey.buttonAction.action,
                    text: 'Are you sure?'
                };

                if(selectedViewKey.buttonAction.confirmMessage ){
                    confirmMessage = selectedViewKey.buttonAction.confirmMessage;
                }
                
                // Show confirmation dialog to make sure user wants to perform action
                _this._dialogService.showConfimationDialog(confirmMessage.title, confirmMessage.text, 'Yes', 'No', 'warning').then((result) => {
                    if (result.value === true) {
                        _this.performButtonAction(selectedViewKey, row);
                    }
                });
            }
            else {
                _this.performButtonAction(selectedViewKey, row);
            }
        }
        
    }

    performButtonAction(selectedViewKey: TableViewKey, row: MatRow) {
        let keys = {};
        if(selectedViewKey.buttonAction.keymap && selectedViewKey.buttonAction.keymap.length > 0){
            selectedViewKey.buttonAction.keymap.forEach( map => {
                keys[map.destination] = row[map.source];
            })
        }

        if (selectedViewKey.buttonAction.action == 'navigate') {

            let target = selectedViewKey.buttonAction.target;
            
            if (selectedViewKey.buttonAction.keyToCheck && selectedViewKey.buttonAction.navigationConditions.length > 0) {
                //console.log('yess');
                let currentValue = row[selectedViewKey.buttonAction.keyToCheck];
                //console.log(currentValue);
                if (currentValue !== undefined) {
                    selectedViewKey.buttonAction.navigationConditions.forEach(map => {
                        //console.log(map.ifValue);
                        if (map.ifValue == currentValue) {
                            target = map.newTarget;
                            //console.log(target);
                        }
                    })
                }
            }           

            let mergedParams = { entry: { name: target, type: selectedViewKey.buttonAction.viewType }, keys: [keys], index: 1, total: 1 };
            this.navigate(mergedParams);
        }
        else if(selectedViewKey.buttonAction.action == 'delete'){
            this.deleteRow(selectedViewKey, keys);
        }
        else if(selectedViewKey.buttonAction.action == 'query'){
            this.runCustomQuery(selectedViewKey, keys);
        }
        else if(selectedViewKey.buttonAction.action == 'downloadAttachment') {
            this.downloadAttachment(selectedViewKey, row);
        }
    }

    performOnSuccessAction(selectedViewKey: TableViewKey, initialKeys: any, responseKeys: any) {
        let _this = this;
        let action = selectedViewKey.buttonAction.onSuccessAction;
        if(action == 'reload') {
            // reload
            _this.loadData();
        }
        else if(action == 'navigate') {
            // navigate
            //Create complete keys lists by combining both initial and response keys
            let allKeys = JSON.parse(JSON.stringify(initialKeys));
                if(responseKeys != null){
                Object.keys(responseKeys).forEach( key => {
                    allKeys[key] = responseKeys[key];
                });
            }

            let keys = {};
            if(selectedViewKey.buttonAction.onSuccessActionKeymap && selectedViewKey.buttonAction.onSuccessActionKeymap.length > 0){
                selectedViewKey.buttonAction.onSuccessActionKeymap.forEach( map => {
                    keys[map.destination] = allKeys[map.source];
                })
            }
            else {
                keys = allKeys;
            }

            let mergedParams = { entry: { name: selectedViewKey.buttonAction.target, type: selectedViewKey.buttonAction.viewType }, keys: [keys], index: 1, total: 1 };            
            _this.navigate(mergedParams);    

        }
        else if(action == 'update_time_tracker') {
            //_this._timeTrackerService.isTrStarted = !_this._timeTrackerService.isTrStarted;
            //_this._timeTrackerService.fromOtherPlaces = true;
            _this._timeTrackerService.checkStatus();
        }
        else if(action == 'update_time_tracker_and_reload') {
            // check Timer Status first
            //_this._timeTrackerService.isTrStarted = !_this._timeTrackerService.isTrStarted;
            //_this._timeTrackerService.fromOtherPlaces = true;
            _this._timeTrackerService.checkStatus();
            
            // reload
            _this.loadData();
        }
    }

    navigate(params){
        setTimeout(() => { this.sendEvent.emit({ eventType: 'navigate', queryParams: params }); }, 50);
    }

    deleteRow(selectedViewKey: TableViewKey, keys: any) {
        var _this = this;
        const subscription = _this.backendService.deleteData(_this.tableData.entryName, _this.authService.getCurrentCompany(_this.currentKeys), [keys]).subscribe(
            result => {
                _this._console.log(result);
                if (result.result === 'OK') {
                    // Show success toast
                    _this._toastService.showSuccessToast('Table row Deleted');

                }
                else {
                    // Show error snackbar
                    _this._toastService.showErrorToast("Error ",JSON.stringify(result.reason.detail));
                }
            },
            error => {
                _this._console.log(error);
                _this._toastService.showErrorToast('An error occured!', error);
            }
        );
    }

    runCustomQuery(selectedViewKey: TableViewKey, keys: any) {
        let _this = this;
        _this.backendService.runCustomQuery(_this.tableData.entryName, _this.authService.getCurrentCompany(_this.currentKeys), keys, selectedViewKey.key).subscribe(
            response => {
                if(response.result == 'OK') {
                    if(selectedViewKey.buttonAction.onSuccessAction != null) {
                        _this.performOnSuccessAction(selectedViewKey, keys, response.response);
                    }
                }
            },
            error => {
                console.error(error);
            }
        )
    }

    downloadAttachment(selectedViewKey: TableViewKey, row: MatRow) {
        let _this = this;
        // Value must be file_id^filename 
        let data = row[selectedViewKey.key].split('^');


        const file_id = data[0];
        const filename = data[1];
        if(file_id && filename)
        {
            _this._dialogService.showLoadingDialog('Downloading attachment', 'Please wait...');            
            const subscription = _this.backendService.getFileURL(null, _this.authService.getCurrentCompany(_this.currentKeys), {}, file_id).subscribe(
                url => {
                    if (url != null) {
                        _this.subscriptions.push(_this.httpClient.get(url.url, { responseType: 'blob' }).subscribe(
                            fileData => {
                                saveAs(fileData, filename);
                                _this._dialogService.closeDialog();
                                _this._toastService.showSuccessToast('Attachment downloaded successfully!');
                            },
                            error => {
                                _this._dialogService.closeDialog();
                                _this._toastService.showErrorToast('An error occured!');
                            }));
                    }
                },
                error => {
                    _this._dialogService.closeDialog();
                    _this._toastService.showErrorToast('An error occured!');
                });
            _this.subscriptions.push(subscription);

        }
        else {
            _this._toastService.showErrorToast('File does not exist!');
        }
    }

    getColumnLabels(viewKeys: TableViewKey[]) {
        let colLabels = viewKeys.map(c => c.key);
        return colLabels;
    }

    getCurrentKeys(validKeysArray: TableViewKey[], inputKeys: any) {

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
            this._toastService.showSuccessToast('Saved successfully!'); // show success toast
            this.loadSearchToggles(this.completeSearchKeys);
            this.loadTable(null); // reload the table to visualize the record
        }
        else { // forward to parent
            this.sendEvent.emit(event);
        }
    }

    importData() {
        const _this = this;
        // at the moment we only handle Archiflow import 
        if (_this.importDataSource === 'archiflow') {
            _this._dialogService.showLoadingDialog('Connecting to Archiflow', 'Please wait...');
            _this.subscriptions.push(_this.backendService.updateArchiflow(0).subscribe( // get the number of records
                result => {
                    _this._console.log(result);
                    _this._dialogService.closeDialog();
                    _this._dialogService.showLoadingDialog('Retrieving records from Archiflow', 'Please wait...');
                    if (result.result === 'OK') {
                        _this.subscriptions.push(_this.backendService.updateArchiflow(result.numRecords).subscribe(
                            innerResult => {
                                _this._console.log(innerResult);
                                if (innerResult.result === 'OK') {
                                    _this.loadData();
                                    _this._dialogService.closeDialog();
                                    _this._toastService.showSuccessToast('Successfully updated!'); // show success toast
                                } else {
                                    _this._dialogService.closeDialog();
                                    _this._toastService.showErrorToast('An error occured!');
                                }
                            },
                            innerError => {
                                _this._dialogService.closeDialog();
                                _this._toastService.showErrorToast('An error occured!');
                            }
                        ));
                    } else {
                        _this._dialogService.closeDialog();
                        _this._toastService.showErrorToast('An error occured!');
                    }
                },
                error => {
                    _this._dialogService.closeDialog();
                    _this._toastService.showErrorToast('An error occured!');
                }
            ));
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
                - 36 // buttons
        }
    }

    reload() {
        this._console.log('onReload: table-view');
        this.onReload.emit();
    }





    private process_form_row(input_form_row: FieldConfig[], margins: number): void {
        let sameLineElements: FieldConfig[] = [];
        for (const result of input_form_row) {
            if (result.isVisible) {
                sameLineElements.push(result);
            }
            else {
                result.width = 0;
            }
            if (result['newLine'] === true && sameLineElements !== null && sameLineElements.length > 0) {
                // result.width = this.processInlineElements(sameLineElements, margins);
                this.processInlineElements(sameLineElements, margins);
                sameLineElements = [];
            }

        }
        this.processInlineElements(sameLineElements, margins); // handles inline elements of last line
    }

    private processInlineElements(elements: FieldConfig[], margins: number): number {


        // Nicola's code
        // const numElements = 1 + elements.length; // current + previouses
        const numElements = elements.length; // current + previouses
        let sumWidths = 0;
        if (elements.length) { // some elements to put on the same line
            // process the elements with defined 1/10 size first
            const singleWidth = Math.floor(100 / numElements);
            // for (const element of elements) {
            //     element.width = singleWidth - margins; // considering 4% margins;
            //     sumWidths += singleWidth;
            // }
            for (let i = 0; i < elements.length; i++) {
                if (i === elements.length - 1) {
                    elements[i].width = 100 - margins - sumWidths; // considering 4% margins;
                }
                else {
                    if (elements[i].width === null) {
                        sumWidths += singleWidth;
                        elements[i].width = singleWidth - margins; // considering 4% margins;
                    }
                    else {
                        sumWidths += elements[i].width;
                        elements[i].width = elements[i].width - margins; // considering 4% margins;
                    }
                }

            }
        }
        return (100 - margins - sumWidths); // considering 4% margins
    }


    // Import export stuff
    uploadCSV(): void {
        this._importExportService.importCSV(this.tableData.entryName);
    }

    importAdvanced(item: ImportItem) {
        this._importExportService.importAdvancedCSV(this.tableData.entryName, this.tableData.keys, item.label, false);    
    }

    downloadTemplateFile(): void {
        this._importExportService.getTemplateFile(this.tableData.entryName);
    }

    downloadCSV() {
        this._importExportService.downloadCSV(this.tableData.entryName, this.authService.getCurrentCompany(this.currentKeys), this.tableData.keys, null, false, {}, null);
    }

    downloadAdvancedCSV(item: ExportItem): void {
        this._importExportService.downloadCSV(this.tableData.entryName, this.authService.getCurrentCompany(this.currentKeys), this.tableData.keys, null, false, {}, item.label);
    }

    downloadExcel() {
        this._importExportService.downloadExcel(this.tableData.entryName, this.authService.getCurrentCompany(this.currentKeys), this.tableData.keys, null, false, {}, null);
    }

    downloadAdvancedExcel(item: ExportItem): void {
        this._importExportService.downloadExcel(this.tableData.entryName, this.authService.getCurrentCompany(this.currentKeys), this.tableData.keys, null, false, {}, item.label);
    }

    loadDriveContents(folder: string = null) {
        let _this = this;
        _this.isLoading = true;
        _this.authService.loadDriveContents(folder).subscribe(
            result => {
                if(result['result'] === 'OK') {
                    _this.foldersSource = result['data'].filter(x => x['mimeType'] === 'application/vnd.google-apps.folder');
                    _this.folders = _this.foldersSource.map( x => x['name']);
                    _this.filesSource = result['data'].filter(x => x['mimeType'] !== 'application/vnd.google-apps.folder');
                    _this.files = _this.filesSource.map( x => x['name']);
                }
                _this._console.log(result);
                _this.isLoading = false;
            },
            error => {
              console.error(error);
              _this.isLoading = false;
            }
        );
    }
}