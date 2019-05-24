import { NgModule } from '@angular/core';
import { GenericTableModule } from '../../generic-table/generic-table.module';
import { RouterModule } from '@angular/router';
import { MngtUnitsComponent } from './mngt-units.component';

const routes = [
    {
        path     : 'gorico/mngt-units',
        component: MngtUnitsComponent
    }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes),
    GenericTableModule
  ],
  declarations: [MngtUnitsComponent],
  exports: [MngtUnitsComponent]
})
export class MngtUnitsModule { }
