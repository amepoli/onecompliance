import { Component, OnInit, ViewChild } from '@angular/core';
import { GenericTableService } from './generic-table.service';
import { MatTableDataSource, MatPaginator, MatSort, MatRow } from '@angular/material';

import { Router} from '@angular/router';

import { AuthService } from 'app/login-page/auth.service';



@Component({
  selector: 'app-generic-table',
  templateUrl: './generic-table.component.html',
  styleUrls: ['./generic-table.component.scss']
})



export class GenericTableComponent implements OnInit {

  displayedColumns = []; // to override in derived classes
  dataSource: MatTableDataSource<any>;
  selectedRow: MatRow = null;
  isLoading = true;

  codice_part: string;

  indexArray: number[];

  path = ''; // to override in derived classes

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  mapResponse = (response: any[]) => response.map((p) => ({
    ID: parseInt( p.id, 10),
  }))

  constructor(protected tableService: GenericTableService,
              protected router: Router,
              protected authService: AuthService) { 
  }

  ngOnInit(): void {

    

    this.codice_part = this.authService.getCode();

    this.tableService.getData(this.path, this.codice_part, '').subscribe(
      results => {
        this.dataSource = new MatTableDataSource(this.mapResponse(results));
        this.dataSource.sort = this.sort;
        this.dataSource.paginator = this.paginator;
        // triggers any change in displayed datasource, setting the array of indexes
        this.dataSource.connect().subscribe(d => {
          this.indexArray = d.map(a => a.ID);
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
        const id = row['ID'];
        const table = this.path.slice(1);
        this.tableService.indexArray = this.indexArray;
        this.tableService.currentIndex = index;
        setTimeout(() => { this.router.navigate(['/gorico/details'], { queryParams: { table: table, part: this.codice_part,
            id: id } }); }, 50);
  }
    
}


