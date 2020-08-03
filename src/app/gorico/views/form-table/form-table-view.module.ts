import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormTableViewComponent } from './form-table-view.component';
import { FormGetterModule } from '../form-getter/form-getter.module';
import { DynamicFormsModule } from 'app/gorico/dynamic-forms/dynamic-forms.module';
import { MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule } from '@angular/material';
import { FormViewModule } from '../form/form-view.module';

@NgModule({
  declarations: [FormTableViewComponent],
  imports: [
    CommonModule,
    FormGetterModule,
    DynamicFormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    FormViewModule
  ],
  exports: [
    FormTableViewComponent
  ],
  entryComponents: [FormTableViewComponent]
})
export class FormTableViewModule { }
