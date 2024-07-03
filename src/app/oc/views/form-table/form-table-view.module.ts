import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormTableViewComponent } from './form-table-view.component';
import { FormGetterModule } from '../form-getter/form-getter.module';
import { DynamicFormsModule } from 'app/oc/dynamic-forms/dynamic-forms.module';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
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
        MatFormFieldModule
    ],
    exports: [
        FormTableViewComponent
    ]
})
export class FormTableViewModule { }
