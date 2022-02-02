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
import { CheckboxGroupComponent } from './components/checkboxgroup/checkboxgroup.component';
import { CheckboxComponent } from './components/checkbox/checkbox.component';
import { DynamicFormComponent } from './components/dynamic-form/dynamic-form.component';
import { ComboboxComponent } from './components/combobox/combobox.component';
import { TextAreaComponent } from './components/textarea/textarea.component';
import { InvisibleComponent } from './components/invisible/invisible.component';
import { MenuComponent } from "./components/menu/menu.component";
import { LabelComponent } from './components/label/label.component';
import { SubformComponent } from './components/subform/subform.component';
import { WidgetComponent } from './components/widget/widget.component';

import { OneCompliancePipesModule } from '../pipes/pipes.module';
import { DynamicFieldDirective } from '../directives';
import { SubFormDynamicFieldDirective } from '../directives/subform-dynamic-field.directive';

import { AttachmentsModule } from '../widgets/attachments/attachments.module';
import { ShareModule } from '../widgets/share/share.module';

import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { MatMenuModule } from '@angular/material/menu';

import { AngularEditorModule } from '@kolkov/angular-editor';
import { S3ManagerModule } from '../widgets/s3-manager/s3-manager.module';

@NgModule({
  declarations: [
    InputComponent,
    ButtonComponent,
    SelectComponent,
    DateComponent,
    RadiobuttonComponent,
    CheckboxGroupComponent,
    CheckboxComponent,
    MenuComponent,
    DynamicFieldDirective,
    SubFormDynamicFieldDirective,
    DynamicFormComponent,
    ComboboxComponent,
    TextAreaComponent,
    InvisibleComponent,
    WidgetComponent,
    LabelComponent,
    SubformComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MaterialModule,
    ReactiveFormsModule,
    FormsModule,
    MatMenuModule,
    NgxMatSelectSearchModule,
    OneCompliancePipesModule,
    AngularEditorModule,

    // Widgets
    AttachmentsModule,
    ShareModule,
    S3ManagerModule
  ],
  exports: [
    InputComponent,
    ButtonComponent,
    SelectComponent,
    DateComponent,
    RadiobuttonComponent,
    CheckboxGroupComponent,
    CheckboxComponent,
    DynamicFieldDirective,
    DynamicFormComponent,
    ComboboxComponent,
    TextAreaComponent,
    InvisibleComponent,
    WidgetComponent,
    LabelComponent,
    SubformComponent
  ],
  entryComponents: [
    InputComponent,
    ButtonComponent,
    SelectComponent,
    DateComponent,
    RadiobuttonComponent,
    CheckboxGroupComponent,
    CheckboxComponent,
    MenuComponent,
    ComboboxComponent,
    TextAreaComponent,
    InvisibleComponent,
    WidgetComponent,
    LabelComponent,
    SubformComponent
  ],
  providers: [{ provide: MAT_DATE_LOCALE, useValue: 'it' }]
})
export class DynamicFormsModule { }
