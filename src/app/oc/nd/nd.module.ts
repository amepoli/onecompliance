// import { BrowserModule } from '@angular/platform-browser';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA, NgModule } from '@angular/core';

import { BrowserAnimationsModule, provideAnimations } from '@angular/platform-browser/animations';
import { NDMaterialModule } from './ndmaterial.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { NDButtonComponent } from './components/ndbutton/ndbutton.component';

import { OneCompliancePipesModule } from '../../oc/pipes/pipes.module';

import { AttachmentsModule } from '../../oc/widgets/attachments/attachments.module';
import { MultiAttachmentsModule } from '../../oc/widgets/multi-attachments/multi-attachments.module';
import { ShareModule } from '../../oc/widgets/share/share.module';

import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MAT_DATE_LOCALE } from '@angular/material/core';

import { AngularEditorModule } from '@kolkov/angular-editor';
import { S3ExplorerModule } from '../../oc/widgets/s3-explorer/s3-explorer.module';
import { OCDateModule, OCDateTimeModule } from '../../oc/adapters';

@NgModule({
    declarations: [
        NDButtonComponent,
    ],
    imports: [
        // BrowserModule,
        CommonModule,
        // BrowserAnimationsModule,
        NDMaterialModule,
        ReactiveFormsModule,
        FormsModule,
        NgxMatSelectSearchModule,
        OneCompliancePipesModule,
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
        NDButtonComponent,
    ],
    providers: [{ provide: MAT_DATE_LOCALE, useValue: 'it-IT' }, provideAnimations()],
    schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]
})
export class NDModule { }
