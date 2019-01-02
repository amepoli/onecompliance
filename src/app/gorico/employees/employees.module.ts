import { NgModule } from '@angular/core';
import { GenericTableModule } from '../generic-table/generic-table.module';
import { EmployeesComponent } from './employees.component';
import { RouterModule } from '@angular/router';

const routes = [
    {
        path     : 'gorico/employees',
        component: EmployeesComponent
    }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes),
    GenericTableModule
  ],
  declarations: [EmployeesComponent]
})
export class EmployeesModule { }
