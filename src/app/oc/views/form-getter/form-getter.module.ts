import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGetterComponent } from './form-getter.component';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatOptionModule } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
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
        MatDialogModule,
        MatProgressBarModule
    ],
    exports: [
        FormGetterComponent
    ],
    declarations: [FormGetterComponent]
})

export class FormGetterModule { }
