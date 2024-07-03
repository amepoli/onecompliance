import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatLegacyProgressSpinnerModule as MatProgressSpinnerModule } from '@angular/material/legacy-progress-spinner';
import { MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MainTableComponent } from './main-table.component';
import { TableViewModule } from 'app/oc/views/table/table-view.module';
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card';
import { RouterModule } from '@angular/router';
import { FormViewModule } from '../views/form/form-view.module';
import { FormViewToolbarModule } from '../views/form-view-toolbar/form-view-toolbar.module';
import { BottomTabsModule } from 'app/oc/bottom-tabs/bottom-tabs.module';
import { ImportDialogModule } from '../dialogs/import.dialog/import.dialog.module';

const routes = [
  {
    path: 'oc/main-table/:table_name',
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
    FormViewToolbarModule,
    BottomTabsModule,
    ImportDialogModule
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
    FormViewToolbarModule,
    MainTableComponent,
  ],

})

export class MainTableModule { }
