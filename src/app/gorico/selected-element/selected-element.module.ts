import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SelectedElementComponent } from './selected-element.component';
import { SplitViewModule } from 'app/layout/split-view/split-view.module';
import { RouterModule } from '@angular/router';

const routes = [
    {
        path     : 'gorico/details',
        component: SelectedElementComponent
    }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SplitViewModule
  ],
  declarations: [SelectedElementComponent]
})
export class SelectedElementModule { }
