import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimeTrackerComponent } from './time-tracker.component';
import { AttachDialogComponent } from '../../dialogs/attach.dialog/attach.dialog.component';
import { FileUploadComponent } from '../../file-uploader/file-upload/file-upload.component';
import { ProgressComponent } from '../../file-uploader/progress/progress.component';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatOptionModule } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
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
    MatBadgeModule,
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
    TimeTrackerComponent,
  ],
  declarations: [TimeTrackerComponent],
  entryComponents: [
    TimeTrackerComponent
  ]
})

export class TimeTrackerModule { }
