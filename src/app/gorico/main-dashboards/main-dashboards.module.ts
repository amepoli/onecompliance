import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainDashboardsComponent } from './main-dashboards.component';
import { MatCardModule } from '@angular/material';
import { RouterModule } from '@angular/router';
import { DashboardModule } from '../views/dashboard/dashboard.module';

const routes = [
    {
        path     : 'gorico/dashboard',
        component: MainDashboardsComponent
    }
];

@NgModule({
  declarations: [MainDashboardsComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    MatCardModule,
    DashboardModule
  ],
  exports: [
      MainDashboardsComponent
  ],
  entryComponents: [
      MainDashboardsComponent
  ]
})
export class MainDashboardsModule { }
