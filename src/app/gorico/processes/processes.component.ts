import { Component } from '@angular/core';
import { GenericTableService } from './../generic-table/generic-table.service';
import { GenericTableComponent } from '../generic-table/generic-table.component';
import { Router} from '@angular/router';
import { AuthService } from 'app/login-page/auth.service';

@Component({
  selector: 'processes',
  templateUrl: '../generic-table/generic-table.component.html',
  styleUrls: ['../generic-table/generic-table.component.scss']
})
export class ProcessesComponent extends GenericTableComponent {

  constructor(
              protected unitsService: GenericTableService,
              protected router: Router,
              protected authService: AuthService) {
    super(unitsService,router,authService); 

    this.tableName = 'procedure_aziendali';
    this.isMainTable = true;
    this.path = 'processes';
  }

  ngOnInit(): void {

    this.fullListPrimaryKeyValues['codice_azienda'] = this.authService.getCode();   // codice part

    this.processResponse = (response: any[]) => { 
        response.forEach((p) => {
          p.id_procedura = parseInt( p.id_procedura, 10);
        });
     };

    super.ngOnInit();
  }

}
