import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGetterComponent } from './form-getter.component';
import { MatMenuModule, MatToolbarModule, MatTabsModule, MatIconModule, MatButtonModule, MatFormFieldModule, 
    MatOptionModule, MatSelectModule, MatInputModule, MatCardModule, MatProgressSpinnerModule, MatDialogModule} from '@angular/material';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { DynamicFormsModule} from '../../dynamic-forms/dynamic-forms.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatMenuModule,
    MatToolbarModule,
    MatTabsModule,
    MatIconModule,
    MatButtonModule,
    DynamicFormsModule,
    MatFormFieldModule,
    MatOptionModule,
    MatSelectModule,
    MatInputModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatDialogModule
  ],
  exports: [
    FormGetterComponent
  ],
  declarations: [FormGetterComponent],
  entryComponents: [
      FormGetterComponent
  ]
})

export class FormGetterModule { }
