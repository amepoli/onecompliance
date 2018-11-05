import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FullListComponent } from './full-list.component';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';


@NgModule({
  imports: [
    CommonModule,
    MatTableModule,
    MatFormFieldModule,
    MatPaginatorModule,
    MatInputModule,
    MatProgressSpinnerModule
  ],
  declarations: [FullListComponent],
  exports: [FullListComponent]
})
export class FullListModule { }
