import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSortModule } from '@angular/material/sort';
import { MatIconModule, MatButtonModule } from '@angular/material';
import { MainTableComponent } from './main-table.component';
import { TableViewModule } from 'app/gorico/views/table/table-view.module';
import { MatCardModule } from '@angular/material/card';
import { RouterModule } from '@angular/router';
import { FormViewModule } from '../views/form/form-view.module';
import { BottomTabsModule } from 'app/gorico/bottom-tabs/bottom-tabs.module';

const routes = [
    {
        path     : 'gorico/main-table/:table_name',
        component: MainTableComponent
    },
    {
      path     : 'gorico/main-table/:table_name/search',
      component: MainTableComponent
    }
];

@NgModule({
  declarations: [MainTableComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    TableViewModule,
    FormViewModule,
    BottomTabsModule
  ],
  exports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatSortModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    TableViewModule,
    FormViewModule,
    MainTableComponent
  ]
})

export class MainTableModule { }
