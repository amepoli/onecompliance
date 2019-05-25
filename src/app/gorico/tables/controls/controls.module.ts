import { NgModule } from '@angular/core';
import { GenericTableModule } from '../../generic-table/generic-table.module';
import { RouterModule } from '@angular/router';
import { ControlsComponent } from './controls.component';

const routes = [
    {
        path     : 'gorico/controls',
        component: ControlsComponent
    }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes),
    GenericTableModule
  ],
  declarations: [ControlsComponent],
  exports: [ControlsComponent]
})
export class ControlsModule { }
