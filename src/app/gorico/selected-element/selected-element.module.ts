import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SelectedElementComponent } from './selected-element.component';
import { SplitViewModule } from 'app/layout/split-view/split-view.module';

@NgModule({
  imports: [
    CommonModule,
    SplitViewModule
  ],
  declarations: [SelectedElementComponent]
})
export class SelectedElementModule { }
