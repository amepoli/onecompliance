import { Component, Inject, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy, ViewChildren, QueryList } from '@angular/core';
import { MAT_DIALOG_DATA as MAT_DIALOG_DATA, MatDialogRef as MatDialogRef } from '@angular/material/dialog';
import { UntypedFormBuilder } from '@angular/forms';
import { ConsoleLoggerService } from 'app/oc/services/console_logger.service';
import { DialogService } from 'app/oc/services/dialog.service';


@Component({
    selector: 'app-import.dialog',
    templateUrl: './import.dialog.component.html',
    styleUrls: ['./import.dialog.component.scss']
})



export class ImportDialogComponent {

    @ViewChild('singleFileInput', { static: true }) singleFileInput: ElementRef;
    @ViewChild('multipleFilesInput', { static: true }) multipleFilesInput: ElementRef;

    // Store table name, just to pass back to import service
    tableName: string = null;

    constructor(private _formBuilder: UntypedFormBuilder,
        public dialogRef: MatDialogRef<ImportDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private _dialogService: DialogService,
        private _console: ConsoleLoggerService
    ) {
        this.tableName = data.tableName;
    }

    onImport(): void {
        if (this.files && this.files.length) {
            this.dialogRef.close({ tableName: this.tableName, files: this.files, allowMultipleFiles: this.allowMultipleFiles });
        }
        else {
            this._dialogService.showErrorDialog("Error", "No CSV file selected!");
        }
    }

    getFileSize(size: string): string {

        let fileSize = size;

        if (fileSize == null) {
            return '0';
        }

        let numSize = parseInt(size);
        if (numSize < 1024 * 1024) {
            numSize = numSize / 1024;
            fileSize = numSize.toFixed(2) + ' KB';
        } else if (numSize >= 1024 * 1024) {
            numSize = numSize / (1024 * 1024);
            fileSize = numSize.toFixed(2) + ' MB';
        }

        return fileSize;

    }

    // Files list
    files: any[] = [];

    // Should allow multiple files or not
    // At the time being, only single file upload is working though
    allowMultipleFiles: boolean = false;

    public fileChangeEvent(fileInput: any) {
        if (fileInput.target.files && fileInput.target.files[0]) {

            // Setup files
            if (this.allowMultipleFiles) {
                if (!this.files) {
                    this.files = []
                }
            }
            else {
                this.files = [];
            }

            // Save all selected files
            for (let i = 0; i < fileInput.target.files.length; i++) {
                this.files = [...this.files, fileInput.target.files[i]]
            }

            this._console.table(this.files);
        }

        // Clear files input element
        if (this.allowMultipleFiles) {
            this.multipleFilesInput.nativeElement.value = "";
        }
        else {
            this.singleFileInput.nativeElement.value = "";
        }
    }

    // add or replace file(s)
    addFiles() {
        if (this.allowMultipleFiles) {
            this.multipleFilesInput.nativeElement.click();
        }
        else {
            this.singleFileInput.nativeElement.click();
        }
    }

    // Remove file from files list
    removeFile(i: number) {
        if (this.files && this.files[i]) {
            this._console.log(`Removing: ${i}`);
            this.files.splice(i, 1);
        }
    }

}
