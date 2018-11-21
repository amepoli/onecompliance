import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialModule } from './material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InputComponent } from './components/input/input.component';
import { ButtonComponent } from './components/button/button.component';
import { SelectComponent } from './components/select/select.component';
import { DateComponent } from './components/date/date.component';
import { RadiobuttonComponent } from './components/radiobutton/radiobutton.component';
import { CheckboxComponent } from './components/checkbox/checkbox.component';
import { DynamicFieldDirective } from './components/dynamic-field/dynamic-field.directive';
import { DynamicFormComponent } from './components/dynamic-form/dynamic-form.component';

@NgModule({
  declarations: [
    InputComponent,
    ButtonComponent,
    SelectComponent,
    DateComponent,
    RadiobuttonComponent,
    CheckboxComponent,
    DynamicFieldDirective,
    DynamicFormComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MaterialModule,
    ReactiveFormsModule,
    FormsModule
  ],
  exports: [
    InputComponent,
    ButtonComponent,
    SelectComponent,
    DateComponent,
    RadiobuttonComponent,
    CheckboxComponent,
    DynamicFieldDirective,
    DynamicFormComponent
  ], 
  entryComponents: [
    InputComponent,
    ButtonComponent,
    SelectComponent,
    DateComponent,
    RadiobuttonComponent,
    CheckboxComponent
  ],
  providers: []
})
export class DynamicFormsModule {}
