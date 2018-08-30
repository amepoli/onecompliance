import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AngularSplitModule } from 'angular-split';
import { SplitViewComponent } from 'app/layout/split-view/split-view.component';


@NgModule({
  imports: [
    CommonModule,
    AngularSplitModule
  ],
  declarations: [
      SplitViewComponent
  ],

  exports     : [
    SplitViewComponent
]
})
export class SplitViewModule { }
