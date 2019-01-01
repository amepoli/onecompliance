import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MngtUnitsComponent } from './mngt-units.component';
import { RouterModule } from '@angular/router';
import { AmplifyAngularModule } from 'aws-amplify-angular';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatSortModule } from '@angular/material/sort';


const routes = [
    {
        path     : 'gorico/mng_units',
        component: MngtUnitsComponent
    }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes),
    CommonModule,
    AmplifyAngularModule,
    MatTableModule,
    MatFormFieldModule,
    MatPaginatorModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatSortModule
  ],
  declarations: [MngtUnitsComponent]
})
export class MngtUnitsModule { }
