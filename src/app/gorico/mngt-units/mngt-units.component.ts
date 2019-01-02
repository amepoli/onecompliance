import { Component } from '@angular/core';
import { GenericTableService } from './../generic-table/generic-table.service';
import { GenericTableComponent } from '../generic-table/generic-table.component';
import { Router} from '@angular/router';
import { AuthService } from 'app/login-page/auth.service';

@Component({
  selector: 'mngt-units',
  templateUrl: '../generic-table/generic-table.component.html',
  styleUrls: ['../generic-table/generic-table.component.scss']
})
export class MngtUnitsComponent extends GenericTableComponent {


  constructor(protected unitsService: GenericTableService,
              protected router: Router,
              protected authService: AuthService) {
      super(unitsService,router,authService); 
      unitsService.path = '/management-units';
  }

  ngOnInit(): void {

    this.displayedColumns = ['ID', 'Codice', 'Descrizione', 'Responsabile', 'Parente'];

    this.mapResponse = (response: any[]) => response.map((p) => ({
      ID: parseInt( p.id, 10),
      Codice: p.codice,
      Descrizione: p.descrizione,
      Responsabile: p.responsabile,
      Parente: p.parente
    }));

    super.ngOnInit();
  }
  
}


