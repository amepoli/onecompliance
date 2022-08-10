import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from './dashboard.component';
import { WebDataRocksPivot } from '../../../webdatarocks/webdatarocks.angular4';


@NgModule({
    declarations: [DashboardComponent, WebDataRocksPivot],
    imports: [
        CommonModule
    ],
    exports: [
        DashboardComponent
    ]
})
export class DashboardModule { }
