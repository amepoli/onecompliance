import { Component } from '@angular/core';
import { GenericTableService } from '../../generic-table/generic-table.service';
import { GenericTableComponent } from '../../generic-table/generic-table.component';
import { Router} from '@angular/router';
import { AuthService } from 'app/login-page/auth.service';

@Component({
  selector: 'controls',
  templateUrl: '../../generic-table/generic-table.component.html',
  styleUrls: ['../../generic-table/generic-table.component.scss']
})
export class ControlsComponent extends GenericTableComponent {


  constructor(
              protected tableService: GenericTableService,
              protected router: Router,
              protected authService: AuthService) {
      super(tableService, router, authService); 
      
      this.tableName = 'presidi';
      this.isMainTable = true;
      this.path = 'controls';
  }

  ngOnInit(): void {

    this.fullListPrimaryKeyValues['codice_part'] = this.authService.getCode();   // codice part

    this.processResponse = (response: any[]) => { 
     };

    super.ngOnInit();
  }
}

