import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSortModule } from '@angular/material/sort';
import { MatIconModule, MatButtonModule, MatDialogModule } from '@angular/material';
import { TableViewModule } from 'app/gorico/views/table/table-view.module';
import { MatCardModule } from '@angular/material/card';
import { RouterModule } from '@angular/router';
import { BottomTabsModule } from 'app/gorico/bottom-tabs/bottom-tabs.module';
import { ImportDialogComponent } from './import.dialog.component';
import { FormViewModule } from 'app/gorico/views/form/form-view.module';
import { FormViewToolbarModule } from 'app/gorico/views/form-view-toolbar/form-view-toolbar.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormGetterModule } from 'app/gorico/views/form-getter/form-getter.module';


@NgModule({
  imports: [
    FormsModule,
    CommonModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    TableViewModule,
    FormGetterModule,
    FormViewModule,
    FormViewToolbarModule,
    BottomTabsModule,
    BottomTabsModule,
  ],
  exports: [
    ImportDialogComponent
  ],
  declarations: [ImportDialogComponent],
  entryComponents: [
    ImportDialogComponent
  ]
})

export class ImportDialogModule { }
