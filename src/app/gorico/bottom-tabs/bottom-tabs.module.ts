import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material';
import { BottomTabsComponent } from './bottom-tabs.component';

@NgModule({
  declarations: [BottomTabsComponent],
  imports: [
    CommonModule,
    MatTabsModule
  ],
  exports: [BottomTabsComponent]
})
export class BottomTabsModule { }
