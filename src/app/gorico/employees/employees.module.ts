import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmployeesComponent } from './employees.component';
import { RouterModule } from '@angular/router';
import { SplitViewModule } from 'app/layout/split-view/split-view.module';

const routes = [
    {
        path     : 'gorico/employees',
        component: EmployeesComponent
    }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes),
    SplitViewModule,
    CommonModule
  ],
  declarations: [EmployeesComponent]
})
export class EmployeesModule { }
