import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material';
import { BottomTabsComponent } from './bottom-tabs.component';
import { TableViewModule } from '../views/table/table-view.module';

@NgModule({
  declarations: [BottomTabsComponent],
  imports: [
    CommonModule,
    MatTabsModule,
    TableViewModule
  ],
  exports: [BottomTabsComponent]
})
export class BottomTabsModule { }
