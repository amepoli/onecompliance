import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { AngularSplitModule } from 'angular-split';
import { SplitViewComponent } from 'app/split-view/split-view.component';

const routes = [
    {
        path     : 'main',
        component: SplitViewComponent
    }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
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
