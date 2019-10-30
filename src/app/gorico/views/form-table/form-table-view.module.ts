import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormTableViewComponent } from './form-table-view.component';
import { FormGetterModule } from '../form-getter/form-getter.module';
import { DynamicFormsModule } from 'app/gorico/dynamic-forms/dynamic-forms.module';

@NgModule({
  declarations: [FormTableViewComponent],
  imports: [
    CommonModule,
    FormGetterModule,
    DynamicFormsModule
  ],
  exports: [
      FormTableViewComponent
  ],
  entryComponents: [FormTableViewComponent]
})
export class FormTableViewModule { }
