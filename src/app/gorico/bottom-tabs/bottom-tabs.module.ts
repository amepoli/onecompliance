import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material';
import { BottomTabsComponent } from './bottom-tabs.component';
import { MngtUnitsModule } from 'app/gorico/mngt-units/mngt-units.module';

@NgModule({
  declarations: [BottomTabsComponent],
  imports: [
    CommonModule,
    MatTabsModule,
    MngtUnitsModule
  ],
  exports: [BottomTabsComponent]
})
export class BottomTabsModule { }
