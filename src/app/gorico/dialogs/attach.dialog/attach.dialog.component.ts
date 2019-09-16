import { Component, Inject, OnInit, ViewChild, ElementRef, AfterViewInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { FileManagerService } from 'app/main/apps/file-manager/file-manager.service';
import { BackendService } from 'app/gorico/views/backend/backend.service';
import { saveAs } from 'file-saver';
import {HttpClient} from '@angular/common/http';
import { FileUploadComponent } from 'app/gorico/file-uploader/file-upload/file-upload.component';

@Component({
  selector: 'app-attach.dialog',
  templateUrl: './attach.dialog.component.html',
  styleUrls: ['./attach.dialog.component.scss']
})



export class AttachDialogComponent implements OnInit, AfterViewInit {

  @ViewChild('fileUploader') fileUploader: FileUploadComponent;

  attach: boolean;

  progress: number;

  form: FormGroup;

  listFiles: any[];

  file: File;

  constructor(private _formBuilder: FormBuilder,
    public dialogRef: MatDialogRef<AttachDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fileService: FileManagerService,
    private backendService: BackendService,
    private httpClient: HttpClient) { 
        // Reactive Form
        this.form = this._formBuilder.group({
            fileContent: new FormControl(null, Validators.required),
            id: [
                {
                    value: 24,
                    disabled: true
                }, Validators.required
            ],
            fileName: ['', Validators.required],
            dimension: [
                {
                    value: 0,
                    disabled: true
                }, Validators.required
            ],
            docURL: [''],
            shortDesc: [''],
            description: [''],
            type: ['']
        });

        this.fileService.onFileAdd.subscribe(result => {
            this.attach = true;
        });


        this.fileService.onFileDownload.subscribe(selected => {
            if (this.listFiles != null) {
                const fileDesc = this.listFiles.find(e => e.client_file_name === selected.name);
                if (fileDesc != null) {
                    this.backendService.getFileURL(this.data.entryName, this.data.keys, fileDesc.file_id).subscribe(
                        url => {
                            if (url != null) {
                                this.httpClient.get(url.url, {responseType: 'blob'}).subscribe(
                                    fileData => {
                                        saveAs(fileData, selected.name);
                                    });
                            }
                        });
                }
            }
        });

        this.attach = false;
    }

    ngOnInit() {
        
        this.backendService.getAttachList(this.data.entryName, this.data.keys).subscribe(
            results => {
                console.log(results);
                this.listFiles = results.list;
                let files = [];
                if (this.listFiles) {
                    this.listFiles.forEach(element => {
                        let file = {
                            'name'     : element.client_file_name,
                            'type'     : 'document',
                            'owner'    : element.autore,
                            'size'     : this.getFileSize(element.dimensione),
                            'modified' : new Date(element.data_upd).toString(),
                            'opened'   : new Date(element.data_ins).toString(),
                            'created'  : new Date(element.data_creazione).toString(),
                            'extention': '',
                            'location' : '',
                            'offline'  : true
                        }
                        files.push(file);
                    });
                }
                this.fileService.files = files;
                this.fileService.getFiles();
            });

        this.progress = 0;
    }

    ngAfterViewInit() {
        var questo = this;
        if (this.fileUploader != null) {
            this.fileUploader.registerOnChange(function (file: File): void {
                questo.file = file;
                console.log('DONE');
            });
        }
    }

    onSave(): void {

        this.attach = false;
        if (this.file != null) {
            this.backendService.createFileURL(this.data.entryName, this.data.keys).subscribe(
                url => {
                    console.log(url);
                    if (url != null) {
                        const blob = new Blob([this.file]);
                        this.httpClient.put(url.url, blob).subscribe (
                        response => {
                            console.log('File uploaded with filename: ', url.filename);
                        });
                    }
                }
            )
        }
    }

    getFileSize (size: string): string {
        
        let fileSize = size;

        if (fileSize == null) {
            return '0';
        }

        let numSize = parseInt(size);
        if (numSize >= 1024 && numSize < 1024*1024) {
            numSize = numSize / 1024;
            fileSize = numSize.toFixed(2) + ' KB';
        } else if (numSize >= 1024*1024) {
            numSize = numSize / (1024 * 1024);
            fileSize = numSize.toFixed(2) + ' MB';
        }

        return fileSize;

    }
    

}
