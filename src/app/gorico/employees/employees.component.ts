import { Component } from '@angular/core';
import { GenericTableService } from './../generic-table/generic-table.service';
import { GenericTableComponent } from '../generic-table/generic-table.component';
import { Router} from '@angular/router';
import { AuthService } from 'app/login-page/auth.service';

@Component({
  selector: 'employees',
  templateUrl: '../generic-table/generic-table.component.html',
  styleUrls: ['../generic-table/generic-table.component.scss']
})
export class EmployeesComponent extends GenericTableComponent {

  constructor(protected unitsService: GenericTableService,
              protected router: Router,
              protected authService: AuthService) {
    super(unitsService,router,authService); 
    this.path = '/employees';
  }

  ngOnInit(): void {
    this.displayedColumns = ['ID', 'Codice', 'Cognome', 'Nome'];

    this.mapResponse = (response: any[]) => response.map((p) => ({
      ID: parseInt( p.id_anagrafica, 10),
      Codice: p.codice,
      Cognome: p.cognome,
      Nome: p.nome
    }));

    super.ngOnInit();
  }

}
