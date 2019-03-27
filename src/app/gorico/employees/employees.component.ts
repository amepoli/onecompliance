import { Component } from '@angular/core';
import { GenericTableService } from './../generic-table/generic-table.service';
import { GenericTableComponent } from '../generic-table/generic-table.component';
import { Router} from '@angular/router';
import { AuthService } from 'app/login-page/auth.service';
import { MatDialog } from '@angular/material';

@Component({
  selector: 'employees',
  templateUrl: '../generic-table/generic-table.component.html',
  styleUrls: ['../generic-table/generic-table.component.scss']
})
export class EmployeesComponent extends GenericTableComponent {

  constructor(public addDialog: MatDialog,
              protected tableService: GenericTableService,
              protected router: Router,
              protected authService: AuthService) {
    super(addDialog, tableService, router, authService); 
    this.path = '/employees';
  }

  ngOnInit(): void {

    this.displayedColumns = [
        {key: 'codice_part', label: 'Codice Parte Azienda', isPrimary: true, isHidden: true},    // key1
        {key: 'id_anagrafica', label: 'ID', isPrimary: true, isHidden: false},                     // key2
        {key: 'codice', label: 'Codice', isPrimary: false, isHidden: false},
        {key: 'cognome', label: 'Cognome', isPrimary: false, isHidden: false},
        {key: 'nome', label: 'Nome', isPrimary: false, isHidden: false}  
    ];

    this.fullListPrimaryKeyValues.key1 = this.authService.getCode();   // codice part

    this.processResponse = (response: any[]) => { 
        response.forEach((p) => {
          p.id_anagrafica = parseInt( p.id_anagrafica, 10);
        });
     };

    super.ngOnInit();
  }

}
