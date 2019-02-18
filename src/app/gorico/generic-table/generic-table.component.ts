import { Component, OnInit, ViewChild } from '@angular/core';
import { GenericTableService } from './generic-table.service';
import { MatTableDataSource, MatPaginator, MatSort, MatRow } from '@angular/material';
import { FieldConfig } from 'app/gorico/dynamic-forms/field.interface';

import { Router} from '@angular/router';

import { AuthService } from 'app/login-page/auth.service';

export interface columnType {
  key: string;
  label: string;
  isPrimary: boolean;
  isHidden: boolean;
}

export interface primaryKeys {
  key1: string;
  key2: string;
  key3: string;
  key4: string;
  key5: string;
  key6: string;
}

@Component({
  selector: 'app-generic-table',
  templateUrl: './generic-table.component.html',
  styleUrls: ['./generic-table.component.scss']
})



export class GenericTableComponent implements OnInit {

  // variables to override
  displayedColumns: columnType[];

  fullListPrimaryKeyValues: primaryKeys = {key1: '', key2: '', key3: '', key4: '', key5: '', key6:''};  // primary key values used to retrieve the full table

  // end variables to override

  dataSource: MatTableDataSource<any>;
  selectedRow: MatRow = null;
  isLoading = true;

  keysArray: any[];

  showAdvSearch: boolean = false;

  regConfig_it: FieldConfig[] = []; 

  path = ''; // to override in derived classes

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;


  // methods to override
  processResponse = (response: any[]) => { 
    response.forEach((p) => {
    });
 }
 // end methods to override


  constructor(protected tableService: GenericTableService,
              protected router: Router,
              protected authService: AuthService) { 
  }

  ngOnInit(): void {
    // set current table params in the service
    const table = this.router.url.split('/', 3)[2];
    this.tableService.tableParams = Object.assign({}, {table: table}, this.fullListPrimaryKeyValues);
    console.log(this.tableService.tableParams);
    this.tableService.getData(this.path, this.fullListPrimaryKeyValues, 'list').subscribe(
      results => {
        this.processResponse(results);
        this.dataSource = new MatTableDataSource(results);
        this.dataSource.sort = this.sort;
        this.dataSource.paginator = this.paginator;
        // triggers any change in displayed datasource, setting the array of primary keys
        this.dataSource.connect().subscribe(source => {
          this.keysArray = source.map(row => {
            const keys = {};
            let i = 1;
            for (const column of this.displayedColumns) {
               if (column.isPrimary) {
                   keys['key' + i++] = row[column.key]; // key1, key2, etc.
               }
            }
            return keys;
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
        const table = this.path.slice(1);
        this.tableService.keysArray = this.keysArray;
        this.tableService.currentIndex = index;
        const mergedParams = Object.assign({}, {table: table, operation: 'select'}, this.keysArray[index]);
        setTimeout(() => { this.router.navigate(['/gorico/details'], { queryParams: mergedParams /*,  skipLocationChange: true*/ }); }, 50);
  }


  getColumnLabels(columns: columnType[]) {
    return columns.map(c => c.label);
  }

  advSearch() {
    if (this.showAdvSearch) {
        this.showAdvSearch = false;
    } else {
        if (this.regConfig_it.length === 0) {
            this.tableService.getData(this.path, this.fullListPrimaryKeyValues, 'search').subscribe(
                results => {
                    this.regConfig_it = results;
                });
        }
        this.showAdvSearch = true;
    }
  }
}
  


