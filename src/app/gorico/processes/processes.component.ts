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
    this.displayedColumns = ['ID', 'Codice', 'DescrizioneBreve', 'CentroGestionale'];

    this.mapResponse = (response: any[]) => response.map((p) => ({
      ID: parseInt( p.id_procedura, 10),
      Codice: p.codice,
      DescrizioneBreve: p.descrizione_breve,
      CentroGestionale: p.centro_gest
    }));

    super.ngOnInit();
  }

}
