import { Component, OnInit, Input, ViewChild, Output, EventEmitter } from '@angular/core';
import { BackendService } from '../backend/backend.service';
import { MatTableDataSource, MatPaginator, MatSort, MatRow } from '@angular/material';

export interface tableViewParams {
    entryName: string, 
    keys: any, 
    showHeader: boolean 
}

@Component({
    selector: 'table-view',
    templateUrl: './table-view.component.html',
    styleUrls: ['./table-view.component.scss']
})



export class TableViewComponent implements OnInit {

    @Input() tableData: tableViewParams;  
    @Output() sendEvent = new EventEmitter<any>();

    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;

    displayedColumns: string[];

    dataSource: MatTableDataSource<any>;
    selectedRow: MatRow = null;
    isLoading = true;

    viewKeys: any; // view fields as specified by the backend

    keysArray: any[];  // list of primary keys values, one entry for each table row

    constructor(
        protected backendService: BackendService) {
    }

    ngOnInit(): void {

    this.backendService.getView(this.tableData.entryName).subscribe(
            params => {
                this.viewKeys = params['table_keys'];
                this.displayedColumns = this.getColumnLabels(this.viewKeys);
                this.loadTable();
            });
    }

    loadTable(): void {
        this.backendService.getData(this.tableData.entryName, this.tableData.keys, false, false).subscribe(
            results => {
                console.log(results);
                this.dataSource = new MatTableDataSource(results);
                this.dataSource.sort = this.sort;
                this.dataSource.paginator = this.paginator;
                // triggers any change in displayed datasource, setting the array of primary keys
                this.dataSource.connect().subscribe(source => {
                    this.keysArray = source.map(row => {
                        const key_values = {};
                        const primaryKeys = this.viewKeys.table_keys.filter(entry => {
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
        setTimeout(() => { this.sendEvent.emit({ eventType: 'rowClick', queryParams: mergedParams }); }, 50);
    }


    getColumnLabels(viewKeys: any) {
        let colLabels = viewKeys.map(c => c.label);
        return colLabels;

    }

}




