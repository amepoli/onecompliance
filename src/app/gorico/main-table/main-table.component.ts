import { Component, OnInit, ViewChild, Input, ElementRef } from '@angular/core';
import { MatTableDataSource, MatPaginator, MatSort, MatRow, MatDialog } from '@angular/material';

import { Router } from '@angular/router';

import { AuthService } from 'app/login-page/auth.service';

@Component({
    selector: 'main-table',
    templateUrl: './main-table.component.html',
    styleUrls: ['./main-table.component.scss']
})



export class MainTableComponent implements OnInit {

    isLoading = true;

    showQuickAdd = false;

    keysArray: any[];

    showAdvSearch = false;

    // to override in derived classes
    protected tableParams = { 
        entryName: '', 
        keys: {},
        showHeader: true
    };

    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;
    @ViewChild('List') private List: ElementRef;


    // methods to override
    processResponse = (response: any[]) => {
        response.forEach((p) => {
        });
    }
    // end methods to override


    constructor(
        protected router: Router) {
    }

    ngOnInit(): void {

        if (this.path) {
            this.tableService.currentPath = this.path; // main table path
        } else {
            this.path = this.tableService.currentPath; // subtable path 
        }

        this.tableService.getData(this.tableName, this.fullListPrimaryKeyValues, 'keys').subscribe(
            keys => {
                let operation: operationType;
                this.displayedColumns = keys;
                this.tableService.tableParams = Object.assign({}, { table: this.tableName }, { keys: this.fullListPrimaryKeyValues });
                console.log(this.tableService.tableParams);
                if (!this.sub_keys) { // main list 
                    this.isMainTable = true;
                    // set current table params in the service
                    operation = 'list';
                } else { // sublist, merge primary keys and son table keys
                    this.isMainTable = false;
                    this.fullListPrimaryKeyValues = Object.assign({}, this.fullListPrimaryKeyValues, this.sub_keys);
                    this.tableService.tableParams = Object.assign({}, this.tableService.tableParams, { sub_keys: this.sub_keys });
                    operation = 'sublist';
                }

                this.loadTable(operation);
            });
    }

    loadTable(tableType: operationType): void {
        this.tableService.getData(this.tableName, this.fullListPrimaryKeyValues, tableType).subscribe(
            results => {
                console.log(results);
                this.processResponse(results);
                this.tableService.fullTable = results;
                this.dataSource = new MatTableDataSource(results);
                this.dataSource.sort = this.sort;
                this.dataSource.paginator = this.paginator;
                // triggers any change in displayed datasource, setting the array of primary keys
                this.dataSource.connect().subscribe(source => {
                    this.keysArray = source.map(row => {
                        const key_values = {};
                        for (const column of this.displayedColumns) {
                            if (column.isPrimary) {
                                key_values[column.key] = row[column.key];
                            }
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


    getColumnLabels(columns: columnType[]) {
        let colLabels = columns.map(c => c.label);
        // comment out to enable icons on rows
        /* if (!this.isMainTable) {
             colLabels.unshift('Actions');
         }*/
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




