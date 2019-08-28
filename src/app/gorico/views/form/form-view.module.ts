import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormViewComponent } from './form-view.component';
import { AttachDialogComponent } from '../../dialogs/attach.dialog/attach.dialog.component';
import { FileUploadComponent } from '../../file-uploader/file-upload/file-upload.component';
import { ProgressComponent } from '../../file-uploader/progress/progress.component';
import { MatMenuModule, MatToolbarModule, MatTabsModule, MatIconModule, MatButtonModule, MatFormFieldModule, 
    MatOptionModule, MatSelectModule, MatInputModule, MatCardModule, MatProgressSpinnerModule, MatDialogModule} from '@angular/material';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { DynamicFormsModule} from '../../dynamic-forms/dynamic-forms.module';
import { FileManagerModule } from 'app/main/apps/file-manager/file-manager.module';

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
    MatDialogModule
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
    FormViewComponent,
    AttachDialogComponent,
    ProgressComponent,
    FileManagerModule,
    FileUploadComponent
  ],
  declarations: [FormViewComponent, AttachDialogComponent, FileUploadComponent, ProgressComponent],
  entryComponents: [
      FormViewComponent,
      AttachDialogComponent,
      FileUploadComponent,
      ProgressComponent
  ]
})

export class FormViewModule { }
