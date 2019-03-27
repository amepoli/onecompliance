import { Component } from '@angular/core';
import { GenericTableService } from './../generic-table/generic-table.service';
import { GenericTableComponent } from '../generic-table/generic-table.component';
import { Router} from '@angular/router';
import { AuthService } from 'app/login-page/auth.service';
import { MatDialog } from '@angular/material';

@Component({
  selector: 'mngt-units',
  templateUrl: '../generic-table/generic-table.component.html',
  styleUrls: ['../generic-table/generic-table.component.scss']
})
export class MngtUnitsComponent extends GenericTableComponent {


  constructor(public addDialog: MatDialog,
              protected tableService: GenericTableService,
              protected router: Router,
              protected authService: AuthService) {
      super(addDialog,tableService, router, authService); 
      this.path = '/mngt-units';
  }

  ngOnInit(): void {

    this.fullListPrimaryKeyValues['codice_part'] = this.authService.getCode();   // codice part

    this.processResponse = (response: any[]) => { 
        response.forEach((p) => {
          p.id = parseInt( p.id, 10);
        });
     };

     console.log('Hey!');

    super.ngOnInit();
  }
  
}

