import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatLegacyTabsModule as MatTabsModule } from '@angular/material/legacy-tabs';
import { BottomTabsComponent } from './bottom-tabs.component';
import { TableViewModule } from '../views/table/table-view.module';
import { FormTableViewModule } from '../views/form-table/form-table-view.module';
import { OneCompliancePipesModule } from '../pipes/pipes.module';


@NgModule({
  declarations: [BottomTabsComponent],
  imports: [
    CommonModule,
    MatTabsModule,
    TableViewModule,
    FormTableViewModule,
    OneCompliancePipesModule
  ],
  exports: [BottomTabsComponent]
})
export class BottomTabsModule { }
