import { NgModule } from '@angular/core';
import { GenericTableModule } from '../../generic-table/generic-table.module';
import { RisksComponent } from './risks.component';
import { RouterModule } from '@angular/router';

const routes = [
    {
        path     : 'gorico/risks',
        component: RisksComponent
    }
];

@NgModule({
    imports: [
        RouterModule.forChild(routes),
        GenericTableModule
      ],
      declarations: [RisksComponent]
})
export class RisksModule { }
