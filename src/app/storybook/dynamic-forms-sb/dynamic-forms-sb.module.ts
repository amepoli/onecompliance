// import { BrowserModule } from '@angular/platform-browser';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA, NgModule } from '@angular/core';

import { BrowserAnimationsModule, provideAnimations } from '@angular/platform-browser/animations';
import { MaterialModule } from './material-sb.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

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

import { OneCompliancePipesModule } from '../../oc/pipes/pipes.module';
import { OneCompliancePipesSBModule } from '../pipes/pipes.module';

import { AttachmentsModule } from '../../oc/widgets/attachments/attachments.module';
import { MultiAttachmentsModule } from '../../oc/widgets/multi-attachments/multi-attachments.module';
import { ShareModule } from '../../oc/widgets/share/share.module';

import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MAT_DATE_LOCALE } from '@angular/material/core';

import { AngularEditorModule } from '@kolkov/angular-editor';
import { S3ExplorerModule } from '../../oc/widgets/s3-explorer/s3-explorer.module';
import { OCDateModule, OCDateTimeModule } from '../../oc/adapters';
import { DynamicFieldSBDirective } from '../directives/dynamic-field-sb.directive';
import { SubFormDynamicFieldSBDirective } from '../directives/subform-dynamic-field-sb.directive';

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
        DynamicFieldSBDirective,
        SubFormDynamicFieldSBDirective,
        DynamicFormComponent,
        ComboboxComponent,
        TextAreaComponent,
        InvisibleComponent,
        WidgetComponent,
        LabelComponent,
        SubformComponent
    ],
    imports: [
        // BrowserModule,
        CommonModule,
        // BrowserAnimationsModule,
        MaterialModule,
        ReactiveFormsModule,
        FormsModule,
        NgxMatSelectSearchModule,
        OneCompliancePipesModule,
        OneCompliancePipesSBModule,
        AngularEditorModule,
        // Widgets
        AttachmentsModule,
        MultiAttachmentsModule,
        ShareModule,
        S3ExplorerModule,

        OCDateModule,
        OCDateTimeModule
    ],
    exports: [
        InputComponent,
        ButtonComponent,
        SelectComponent,
        DateComponent,
        RadiobuttonComponent,
        CheckboxGroupComponent,
        CheckboxComponent,
        DynamicFieldSBDirective,
        DynamicFormComponent,
        ComboboxComponent,
        TextAreaComponent,
        InvisibleComponent,
        WidgetComponent,
        LabelComponent,
        SubformComponent
    ],
    providers: [{ provide: MAT_DATE_LOCALE, useValue: 'it-IT' }, provideAnimations()],
    schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]
})
export class DynamicFormsSBModule { }
