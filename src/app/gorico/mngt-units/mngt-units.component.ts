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


  constructor(protected tableService: GenericTableService,
              protected router: Router,
              protected authService: AuthService) {
      super(tableService, router, authService); 
      this.path = '/mngt-units';
  }

  ngOnInit(): void {

    this.displayedColumns = [
        {key: 'codice_part', label: 'Codice Part', isPrimary: true, isHidden: true},    // key1
        {key: 'id_centro_gest', label: 'ID', isPrimary: true, isHidden: false},                     // key2
        {key: 'codice', label: 'Codice', isPrimary: false, isHidden: false},
        {key: 'descrizione', label: 'Descrizione', isPrimary: false, isHidden: false},
        {key: 'responsabile', label: 'Responsabile', isPrimary: false, isHidden: false},
        {key: 'parente', label: 'Centro Superiore', isPrimary: false, isHidden: false}   // key3
    ];

    this.fullListPrimaryKeyValues.key1 = this.authService.getCode();   // codice part

    this.processResponse = (response: any[]) => { 
        response.forEach((p) => {
          p.id = parseInt( p.id, 10);
        });
     };

    super.ngOnInit();
  }
  
}

