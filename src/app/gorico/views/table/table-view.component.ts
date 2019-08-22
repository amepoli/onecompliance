import { Component, Input, ViewChild, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { BackendService } from '../backend/backend.service';
import { MatTableDataSource, MatPaginator, MatSort, MatRow } from '@angular/material';
import { FieldConfig, Item } from '../../dynamic-forms/field.interface';
import { formViewParams } from '../form/form-view.component';

export interface tableViewParams {
    entryName: string;
    keys: any;
    showHeader: boolean;
    showFullScreenButton: boolean;
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

    @Input() tableData: tableViewParams;
    @Output() sendEvent = new EventEmitter<any>();

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

    dataSource: MatTableDataSource<any>;
    selectedRow: MatRow = null;
    isLoading = true;

    isFullScreen = false;

    viewKeys: tableViewKey[];  // view fields as specified by the backend

    searchKeys: searchViewKey[];

    currentKeys: any; // relevant keys passed by the parent component 

    keysArray: any[];  // list of primary keys values, one entry for each table row

    constructor(
        protected backendService: BackendService) {
    }

    ngOnChanges(changes: SimpleChanges): void {

        if (changes.tableData) {
            this.quickAddFormParams.entryName = this.tableData.entryName;
            this.quickAddFormParams.keys = this.tableData.keys;
            this.backendService.getView(this.tableData.entryName).subscribe(
                params => {
                    this.viewKeys = params.table_keys;
                    this.searchKeys = params.search_keys;
                    this.displayedColumns = this.getColumnLabels(this.viewKeys);
                    this.currentKeys = this.getCurrentKeys(this.viewKeys, this.tableData.keys);
                    this.loadTable(null);
                });
        }
    }

    loadTable(search_keys: any): void {
        this.backendService.getData(this.tableData.entryName, this.currentKeys, search_keys, false, false).subscribe(
            results => {
                console.log(results);
                if (results.search_options) { // got some search combobox options
                    this.searchOptions = results.search_options; // store them
                    results = results.table_data; // and get the table data
                }
                this.searchData = this.getSearchData(this.searchKeys);
                this.dataSource = new MatTableDataSource(results);
                this.dataSource.sort = this.sort;
                this.dataSource.paginator = this.paginator;
                // triggers any change in displayed datasource, setting the array of primary keys
                this.dataSource.connect().subscribe(source => {
                    this.keysArray = source.map(row => {
                        const key_values = {};
                        const primaryKeys = this.viewKeys.filter(entry => {
                            return entry.isPrimary;
                        });
                        for (const primaryKey of primaryKeys) {
                            key_values[primaryKey.key] = row[primaryKey.key];
                        }
                        return key_values;
                    });
                });
                this.isLoading = false;
            },
            error => {
                this.isLoading = false;
            });

    }

    private getSearchData(searchKeys: searchViewKey[]): FieldConfig[] {

        let fieldValues: FieldConfig[] = [];

        if (!searchKeys) {
            return fieldValues;
        }

        searchKeys.forEach(field => {
            let fieldValue: FieldConfig;
            let searchEntry = this.searchOptions ? this.searchOptions.find(e => e.fieldName === field.fieldName) : null;
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
                if (element && element != '') {
                    cleanedValues[key] = element.id ? element.id : element;
                }
            }
        }
        this.loadTable(cleanedValues);
    }

    cancel_search() {
        this.showAdvSearch = false;
        this.loadTable(null);
    }

    cancel(): void {
        this.showQuickAdd = false;
    }

    applyFilter(filterValue: string) {
        filterValue = filterValue.trim(); // Remove whitespace
        filterValue = filterValue.toLowerCase(); // Datasource defaults to lowercase matches
        this.dataSource.filter = filterValue;
        if (this.dataSource.paginator) {
            this.dataSource.paginator.firstPage();
        }
    }

    getRecord(index: number, row: MatRow) {
        this.selectedRow = row;
        const mergedParams = { entry: this.tableData.entryName, keysArray: JSON.stringify(this.keysArray), index: index + 1, total: this.keysArray.length};
        setTimeout(() => { this.sendEvent.emit({ eventType: 'rowClick', queryParams: mergedParams }); }, 50);
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
        this.sendEvent.emit({ eventType: 'fullScreen', queryParams: {value: this.isFullScreen} });
    
    }

    onEvent(event:any) {
        if (event.eventType === 'savedForm') { // quick add form view submitted the new record
            this.showQuickAdd = false; // hide quick add
            this.loadTable(null); // reload the table to visualize the record
        } else  { // forward to parent
            this.sendEvent.emit(event);
        }
    }
}




