import { Component, OnInit, ViewChild } from '@angular/core';
import { MngtUnitsService } from './mngt-units.service';
import { MngtUnit } from './mngt-units.model';
import { MatTableDataSource, MatPaginator, MatSort, MatRow } from '@angular/material';
import { Router } from '@angular/router';


@Component({
  selector: 'app-mngt-units',
  templateUrl: './mngt-units.component.html',
  styleUrls: ['./mngt-units.component.scss']
})
export class MngtUnitsComponent implements OnInit {

  private mngtUnits: MngtUnit[];
  // displayedColumns = ['id', 'codice', 'descrizione', 'responsabile', 'referente', 'parente'];
  displayedColumns = ['id_centro_gest', 'codice', 'descrizione', 'responsabile', 'ute_ref', 'parente'];
  dataSource: MatTableDataSource<any>;
  selectedRow: MatRow = null;
  isLoading = true;

  codice_part = 'DEMO'; // TODO: make this parametric

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(private unitsService: MngtUnitsService,
              private router: Router) { 
  }

  ngOnInit(): void {
    this.unitsService.getData(this.codice_part, '').subscribe(
      results => {
        this.mngtUnits = results;
        this.dataSource = new MatTableDataSource(this.mngtUnits);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
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

    getRecord(row: MatRow) {
        console.log(row);
        this.selectedRow = row;
        const id = row['id_centro_gest'];
        setTimeout(() => { this.router.navigate(['/gorico/details'], { queryParams: { part: this.codice_part,
            id: id } }); }, 50);
    }
}


