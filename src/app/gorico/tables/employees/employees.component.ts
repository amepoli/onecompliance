import { Component } from '@angular/core';
import { GenericTableService } from '../../generic-table/generic-table.service';
import { GenericTableComponent } from '../../generic-table/generic-table.component';
import { Router} from '@angular/router';
import { AuthService } from 'app/login-page/auth.service';

@Component({
  selector: 'employees',
  templateUrl: '../../generic-table/generic-table.component.html',
  styleUrls: ['../../generic-table/generic-table.component.scss']
})
export class EmployeesComponent extends GenericTableComponent {

  constructor(
              protected tableService: GenericTableService,
              protected router: Router,
              protected authService: AuthService) {
    super(tableService, router, authService); 
    this.tableName = 'anagrafiche_id';
    this.isMainTable = true;
    this.path = 'employees';
  }

  ngOnInit(): void {

    this.fullListPrimaryKeyValues['codice_part'] = this.authService.getCode();   // codice part

    this.processResponse = (response: any[]) => { 
        response.forEach((p) => {
          p.id_anagrafica = parseInt( p.id_anagrafica, 10);
        });
     };

    super.ngOnInit();
  }

}
