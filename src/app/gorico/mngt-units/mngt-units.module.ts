import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MngtUnitsComponent } from './mngt-units.component';
import { RouterModule } from '@angular/router';
import { FullListModule } from 'app/gorico/full-list/full-list.module';
import { AmplifyAngularModule } from 'aws-amplify-angular';


const routes = [
    {
        path     : 'gorico/mng_units',
        component: MngtUnitsComponent
    }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes),
    FullListModule,
    CommonModule,
    AmplifyAngularModule
  ],
  declarations: [MngtUnitsComponent]
})
export class MngtUnitsModule { }
