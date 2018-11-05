import { Component, OnInit } from '@angular/core';
import { MngtUnitsService } from './mngt-units.service';
import { DataSource } from '@angular/cdk/collections';
import { MngtUnit } from './mngt-units.model';
import { Observable } from 'rxjs/Observable';


@Component({
  selector: 'app-mngt-units',
  templateUrl: './mngt-units.component.html',
  styleUrls: ['./mngt-units.component.scss']
})
export class MngtUnitsComponent implements OnInit {

currentColumns = ['id', 'codice', 'descrizione', 'responsabile', 'referente', 'parente'];
currentSource = new MngtUnitDataSource(this.unitsService);

  constructor(private unitsService: MngtUnitsService) { 
  }

  ngOnInit(): void {

  }

}

export class MngtUnitDataSource extends DataSource<any> {

    constructor(private unitsService: MngtUnitsService) {
      super();
    }
    connect(): Observable<MngtUnit[]> {

      return this.unitsService.getData();
    }
    disconnect() {
    }
  }
