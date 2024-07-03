import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainDashboardsComponent } from './main-dashboards.component';
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card';
import { RouterModule } from '@angular/router';
import { DashboardModule } from '../views/dashboard/dashboard.module';

const routes = [
    {
        path     : 'oc/dashboard',
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
    ]
})
export class MainDashboardsModule { }
