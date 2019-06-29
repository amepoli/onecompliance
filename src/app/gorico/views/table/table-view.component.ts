import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { BackendService } from '../backend/backend.service';
import { MatTableDataSource, MatPaginator, MatSort, MatRow } from '@angular/material';

import { Router } from '@angular/router';

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

    @Input() tableData: { entryName: string, keys: any, showHeader: boolean };  

    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;

    displayedColumns: columnType[];

    dataSource: MatTableDataSource<any>;
    selectedRow: MatRow = null;
    isLoading = true;

    viewSettings: any;

    keysArray: any[];

    constructor(
        protected router: Router,
        protected backendService: BackendService) {
    }

    ngOnInit(): void {

    this.backendService.getView(this.tableData.entryName, this.tableData.keys).subscribe(
            params => {
                this.viewSettings = params;
                this.displayedColumns = this.getColumnLabels(this.viewSettings);
                this.loadTable();
            });
    }

    loadTable(): void {
        this.backendService.getData(this.tableData.entryName, this.viewSettings, false).subscribe(
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
        const mergedParams = { entry: this.tableData.entryName, keys: JSON.stringify(this.keysArray[index]) };
        setTimeout(() => { this.router.navigate(['/gorico/item'], { queryParams: mergedParams }); }, 50);
    }


    getColumnLabels(viewSettings: any) {
        let colLabels = viewSettings['keys'].map(c => c.column.key);
        return colLabels;

    }

}




