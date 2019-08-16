import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AmplifyAngularModule } from 'aws-amplify-angular';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatSortModule } from '@angular/material/sort';
import { MatIconModule, MatButtonModule } from '@angular/material';
import { TableViewComponent } from './table-view.component';
import { DynamicFormsModule} from '../../dynamic-forms/dynamic-forms.module';

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
    MatSortModule,
    MatIconModule,
    MatButtonModule,
    DynamicFormsModule
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
    MatSortModule,
    MatIconModule,
    MatButtonModule,
    DynamicFormsModule,
    TableViewComponent
  ],
  entryComponents: [
      TableViewComponent
  ]
})

export class TableViewModule { }
