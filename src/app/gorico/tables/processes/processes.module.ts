import { NgModule } from '@angular/core';
import { GenericTableModule } from '../../generic-table/generic-table.module';
import { ProcessesComponent } from './processes.component';
import { RouterModule } from '@angular/router';

const routes = [
    {
        path     : 'gorico/processes',
        component: ProcessesComponent
    }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes),
    GenericTableModule
  ],
  declarations: [ProcessesComponent],
  exports: [ProcessesComponent]
})
export class ProcessesModule { }
