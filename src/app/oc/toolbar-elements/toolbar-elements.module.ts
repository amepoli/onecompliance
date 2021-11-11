import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ToolbarElementsComponent } from './toolbar-elements.component';
import { TableViewModule } from 'app/oc/views/table/table-view.module';
import { MatCardModule } from '@angular/material/card';
import { RouterModule } from '@angular/router';
import { FormViewModule } from '../views/form/form-view.module';
import { FormViewToolbarModule } from '../views/form-view-toolbar/form-view-toolbar.module';
import { BottomTabsModule } from 'app/oc/bottom-tabs/bottom-tabs.module';
import { ImportDialogModule } from '../dialogs/import.dialog/import.dialog.module';

const routes = [
  {
    path: 'oc/toolbar-elements',
    component: ToolbarElementsComponent
  }
];

@NgModule({
  declarations: [ToolbarElementsComponent],
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
    ToolbarElementsComponent,
  ],

})

export class ToolbarElementsModule { }
