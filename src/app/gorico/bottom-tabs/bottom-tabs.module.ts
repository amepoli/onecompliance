import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { BottomTabsComponent } from './bottom-tabs.component';
import { TableViewModule } from '../views/table/table-view.module';
import { FormTableViewModule } from '../views/form-table/form-table-view.module';

@NgModule({
  declarations: [BottomTabsComponent],
  imports: [
    CommonModule,
    MatTabsModule,
    TableViewModule,
    FormTableViewModule
  ],
  exports: [BottomTabsComponent]
})
export class BottomTabsModule { }
