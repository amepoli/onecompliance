import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from './dashboard.component';
import { WebDataRocksPivot } from '../../../webdatarocks/webdatarocks.angular4';
import { RouterModule } from '@angular/router';

const routes = [
    {
        path     : 'gorico/dashboard',
        component: DashboardComponent
    }
];

@NgModule({
  declarations: [DashboardComponent, WebDataRocksPivot],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
  ],
  exports: [
      DashboardComponent
  ],
  entryComponents: [
      DashboardComponent
  ]
})
export class DashboardModule { }
