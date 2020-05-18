import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormViewToolbarComponent } from './form-view-toolbar.component';
import { AttachDialogComponent } from '../../dialogs/attach.dialog/attach.dialog.component';
import { FileUploadComponent } from '../../file-uploader/file-upload/file-upload.component';
import { ProgressComponent } from '../../file-uploader/progress/progress.component';
import {
  MatMenuModule, MatToolbarModule, MatTabsModule, MatIconModule, MatButtonModule, MatFormFieldModule,
  MatOptionModule, MatSelectModule, MatInputModule, MatCardModule, MatProgressSpinnerModule, MatDialogModule
} from '@angular/material';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DynamicFormsModule } from '../../dynamic-forms/dynamic-forms.module';
import { FileManagerModule } from 'app/main/apps/file-manager/file-manager.module';
import { FormGetterModule } from '../form-getter/form-getter.module';

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
    FileManagerModule,
    MatDialogModule,
    FormGetterModule
  ],
  exports: [
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
    FormViewToolbarComponent,
  ],
  declarations: [FormViewToolbarComponent],
  entryComponents: [
    FormViewToolbarComponent
  ]
})

export class FormViewToolbarModule { }
