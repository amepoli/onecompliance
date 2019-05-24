import { Component } from '@angular/core';
import { GenericTableService } from '../../generic-table/generic-table.service';
import { GenericTableComponent } from '../../generic-table/generic-table.component';
import { Router} from '@angular/router';
import { AuthService } from 'app/login-page/auth.service';

@Component({
  selector: 'risks',
  templateUrl: '../../generic-table/generic-table.component.html',
  styleUrls: ['../../generic-table/generic-table.component.scss']
})
export class RisksComponent extends GenericTableComponent {

  constructor(
    protected unitsService: GenericTableService,
    protected router: Router,
    protected authService: AuthService) {
    super(unitsService,router,authService); 
    this.tableName = 'rischi';
    this.isMainTable = true;
    this.path = 'risks';
  }

  ngOnInit(): void {

    this.fullListPrimaryKeyValues['codice_azienda'] = this.authService.getCode();   // codice azienda

    this.processResponse = (response: any[]) => { 
        return;
     };
    super.ngOnInit();
  }
} 
