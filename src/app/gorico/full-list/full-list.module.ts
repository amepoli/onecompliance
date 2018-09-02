import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FullListComponent } from './full-list.component';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';

@NgModule({
  imports: [
    CommonModule,
    MatTableModule,
    MatFormFieldModule,
    MatPaginatorModule,
    MatInputModule
  ],
  declarations: [FullListComponent],
  exports: [FullListComponent]
})
export class FullListModule { }
