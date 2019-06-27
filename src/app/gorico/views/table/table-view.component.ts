import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { BackendService } from '../backend/backend.service';
import { MatTableDataSource, MatPaginator, MatSort, MatRow } from '@angular/material';

export interface columnType {
    key: string;
    label: string;
    isPrimary: boolean;
    isHidden: boolean;
}

@Component({
    selector: 'table-view',
    templateUrl: './table-view.component.html',
    styleUrls: ['./table-view.component.scss']
})



export class TableViewComponent implements OnInit {

    @Input() tableData: { entryName: string, primaryKeys: any };  

    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;

    // variables to override
    displayedColumns: columnType[];

    fullListPrimaryKeyValues: any = {};  // primary key values used to retrieve the full table

    // end variables to override

    dataSource: MatTableDataSource<any>;
    selectedRow: MatRow = null;
    isLoading = true;

    viewSettings: any;

    keysArray: any[];

    constructor(
        protected backendService: BackendService) {
    }

    ngOnInit(): void {

        this.backendService.getView(this.tableData.entryName, this.tableData.primaryKeys).subscribe(
            params => {
                this.viewSettings = params;
                this.displayedColumns = this.getColumnLabels(this.viewSettings);
                this.loadTable();
            });
    }

    loadTable(): void {
        this.backendService.getData(this.tableData.entryName, this.viewSettings).subscribe(
            results => {
                console.log(results);
                this.dataSource = new MatTableDataSource(results);
                this.dataSource.sort = this.sort;
                this.dataSource.paginator = this.paginator;
                // triggers any change in displayed datasource, setting the array of primary keys
                this.dataSource.connect().subscribe(source => {
                    this.keysArray = source.map(row => {
                        const key_values = {};
                        const primaryKeys = this.viewSettings.keys.filter(entry => {
                            return entry.isPrimary;
                        });
                        for (const primaryKey of primaryKeys) {
                                key_values[primaryKey.column.key] = row[primaryKey.column.key];
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
        this.tableService.keysArray = this.keysArray;
        this.tableService.currentIndex = index;
        const mergedParams = { table: this.tableName, keys: JSON.stringify(this.keysArray[index]), operation: 'select' };
        setTimeout(() => { this.router.navigate(['/gorico/details'], { queryParams: mergedParams /*,  skipLocationChange: true*/ }); }, 50);
    }


    getColumnLabels(viewSettings: any) {
        let colLabels = viewSettings['keys'].map(c => c.column.key);
        return colLabels;

    }

    advSearch() {
        if (this.regConfig_it.length === 0) {
            this.tableService.getData(this.tableName, this.fullListPrimaryKeyValues, 'search').subscribe(
                results => {
                    this.regConfig_it = results;
                });
        }
        this.showAdvSearch = true;

    }

    submit_search(value: any) {
        this.tableService.searchData(this.tableName, this.fullListPrimaryKeyValues, value).subscribe(
            result => {
                console.log(result);
                this.dataSource.data = result;
            }
        );
        this.showAdvSearch = false;
    }

    addNew(): void {
        /* Pop-up example
        const dialogRef = this.addDialog.open(AddDialogComponent, {
            width: '800px',
            data: this.tableService.tableParams
          });
      
          dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.addNew();
            }
          });*/

    }


    quickAdd(): void {
        this.showQuickAdd = true;

        this.tableService.getData(this.tableName, this.fullListPrimaryKeyValues, 'create').subscribe(
            results => {
                if (!this.isMainTable) {
                    // recover son keys and make them readonly
                    const son_keys = [];
                    const values = [];
                    const sub_keys = this.tableService.tableParams['sub_keys'];
                    // tslint:disable-next-line:forin
                    for (const key in sub_keys) {
                        son_keys.push(sub_keys[key]['son']);
                        values.push(sub_keys[key]['value']);
                    }
                    results.forEach(element => {
                        const idx = son_keys.indexOf(element['name']);
                        if (idx >= 0) {
                            element['value'] = values[idx];
                            element['readonly'] = true;
                        }
                    });
                }
                this.tableService.process_form(results);
                this.regConfig_it = results;
                setTimeout(() => { this.tableService.scrollToBottom() }, 50);
            });

    }

    fullView(): void {
        this.tableService.setFullScreen(!this.tableService.getFullScreen()); // toggle full view
    }

    submit_new(value: any): void {
        console.log(value);
        const operation = this.isMainTable ? 'list' : 'sublist';
        this.showQuickAdd = false;
        console.log(value, this.regConfig_it);
        this.tableService.prepare_form(value, this.regConfig_it);
        this.tableService.pushData(this.tableName, this.fullListPrimaryKeyValues, value).subscribe(
            result => {
                setTimeout(() => {
                    this.loadTable(operation); // reload table
                    setTimeout(() => { this.tableService.scrollToBottom(), 50 });
                }, 50);

            }
        );
    }

    cancel(): void {
        this.showQuickAdd = false;
    }
}




