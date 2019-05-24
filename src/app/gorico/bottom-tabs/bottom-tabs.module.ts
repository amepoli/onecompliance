import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material';
import { BottomTabsComponent } from './bottom-tabs.component';
import { MngtUnitsModule } from 'app/gorico/tables/mngt-units/mngt-units.module';
import { ProcessesModule } from 'app/gorico/tables/processes/processes.module';

@NgModule({
  declarations: [BottomTabsComponent],
  imports: [
    CommonModule,
    MatTabsModule,
    MngtUnitsModule,
    ProcessesModule
  ],
  exports: [BottomTabsComponent]
})
export class BottomTabsModule { }
