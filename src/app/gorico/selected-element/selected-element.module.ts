import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SelectedElementComponent } from './selected-element.component';
import { SplitViewModule } from 'app/layout/split-view/split-view.module';
import { RouterModule } from '@angular/router';
import { MatMenuModule, MatToolbarModule, MatTabsModule, MatIconModule, MatButtonModule} from '@angular/material';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { DynamicFormsModule} from 'app/gorico/dynamic-forms/dynamic-forms.module';
import { BottomTabsModule } from 'app/gorico/bottom-tabs/bottom-tabs.module';


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
    FormsModule,
    ReactiveFormsModule,
    SplitViewModule,
    MatMenuModule,
    MatToolbarModule,
    MatTabsModule,
    MatIconModule,
    MatButtonModule,
    DynamicFormsModule,
    BottomTabsModule
  ],
  declarations: [SelectedElementComponent]
})
export class SelectedElementModule { }
