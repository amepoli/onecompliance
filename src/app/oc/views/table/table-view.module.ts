import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AmplifyAngularModule } from 'aws-amplify-angular';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TableViewComponent } from './table-view.component';
import { DynamicFormsModule} from '../../dynamic-forms/dynamic-forms.module';
import { FormViewModule } from '../form/form-view.module';
import { OneCompliancePipesModule } from 'app/oc/pipes/pipes.module';
import { TableMultiselectToolbarModule } from '../table-multiselect-toolbar/table-multiselect-toolbar.module';

@NgModule({
  declarations: [TableViewComponent],
  imports: [
    CommonModule,
    AmplifyAngularModule,
    MatTableModule,
    MatFormFieldModule,
    MatPaginatorModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatSlideToggleModule,
    MatSortModule,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,
    DynamicFormsModule,
    FormViewModule,
    TableMultiselectToolbarModule,
    OneCompliancePipesModule
  ],
  exports: [
    CommonModule,
    AmplifyAngularModule,
    MatTableModule,
    MatFormFieldModule,
    MatPaginatorModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatSlideToggleModule,
    MatSortModule,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,
    DynamicFormsModule,
    TableViewComponent
  ],
  entryComponents: [
      TableViewComponent
  ]
})

export class TableViewModule { }
