import { Component } from '@angular/core';
import { GenericTableService } from './../generic-table/generic-table.service';
import { GenericTableComponent } from '../generic-table/generic-table.component';
import { Router} from '@angular/router';
import { AuthService } from 'app/login-page/auth.service';
import { MatDialog } from '@angular/material';

@Component({
  selector: 'articles',
  templateUrl: '../generic-table/generic-table.component.html',
  styleUrls: ['../generic-table/generic-table.component.scss']
})
export class ArticlesComponent extends GenericTableComponent {

  constructor(public addDialog: MatDialog,
    protected unitsService: GenericTableService,
    protected router: Router,
    protected authService: AuthService) {
    super(addDialog,unitsService,router,authService); 
    this.path = '/articles';
  }

  ngOnInit(): void {

    this.displayedColumns = [
        {key: 'id_testo_normativo', label: 'ID Testo', isPrimary: true, isHidden: true},    // key1
        {key: 'codice_articolo_normativo', label: 'Codice Articolo', isPrimary: true, isHidden: false},                     // key2
        {key: 'testo_normativo', label: 'Testo Normativo', isPrimary: false, isHidden: false},
        {key: 'rubrica', label: 'Rubrica', isPrimary: false, isHidden: false}  
    ];

    this.processResponse = (response: any[]) => { 
        return;
     };
    super.ngOnInit();
  }
}
