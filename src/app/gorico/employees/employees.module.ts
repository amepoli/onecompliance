import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmployeesComponent } from './employees.component';
import { RouterModule } from '@angular/router';
import { FullListModule } from 'app/gorico/full-list/full-list.module';

const routes = [
    {
        path     : 'gorico/employees',
        component: EmployeesComponent
    }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes),
    FullListModule,
    CommonModule
  ],
  declarations: [EmployeesComponent]
})
export class EmployeesModule { }
