import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormTableViewComponent } from './form-table-view.component';
import { FormGetterModule } from '../form-getter/form-getter.module';

@NgModule({
  declarations: [FormTableViewComponent],
  imports: [
    CommonModule,
    FormGetterModule
  ],
  entryComponents: [FormTableViewComponent]
})
export class FormTableViewModule { }
