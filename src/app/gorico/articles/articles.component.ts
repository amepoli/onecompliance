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

  constructor(
    protected unitsService: GenericTableService,
    protected router: Router,
    protected authService: AuthService) {
    super(unitsService,router,authService); 
    this.path = '/articles';
  }

  ngOnInit(): void {

    this.processResponse = (response: any[]) => { 
        return;
     };
    super.ngOnInit();
  }
}
