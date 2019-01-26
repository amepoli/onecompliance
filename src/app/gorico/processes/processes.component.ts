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

  constructor(protected unitsService: GenericTableService,
              protected router: Router,
              protected authService: AuthService) {
    super(unitsService,router,authService); 
    this.path = '/processes';
  }

  ngOnInit(): void {

    this.displayedColumns = [
        {key: 'codice_azienda', label: 'Codice Azienda', isPrimary: true, isHidden: true},    // key1
        {key: 'id_procedura', label: 'ID', isPrimary: true, isHidden: false},                     // key2
        {key: 'codice', label: 'Codice', isPrimary: false, isHidden: false},
        {key: 'descrizione_breve', label: 'Descrizione Breve', isPrimary: false, isHidden: false},
        {key: 'centro_gest', label: 'Centro Gestionale', isPrimary: false, isHidden: false}  
    ];

    this.fullListPrimaryKeyValues.key1 = this.authService.getCode();   // codice part

    this.processResponse = (response: any[]) => { 
        response.forEach((p) => {
          p.id_procedura = parseInt( p.id_procedura, 10);
        });
     };

    super.ngOnInit();
  }

}
