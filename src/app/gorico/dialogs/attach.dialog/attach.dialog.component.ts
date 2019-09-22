import { Component, Inject, OnInit, ViewChild, ElementRef, AfterViewInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { FileManagerService } from 'app/main/apps/file-manager/file-manager.service';
import { BackendService } from 'app/gorico/views/backend/backend.service';
import { saveAs } from 'file-saver';
import {HttpClient} from '@angular/common/http';
import { FileUploadComponent } from 'app/gorico/file-uploader/file-upload/file-upload.component';
import { createHash } from 'crypto';    // pls. read https://stackoverflow.com/questions/54162297/module-not-found-error-cant-resolve-crypto
                                        // and https://stackoverflow.com/a/54645398 and then 'npm run build'
import { formViewParams } from 'app/gorico/views/form/form-view.component';
                                        

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

  newTypeParams: formViewParams = {
    entryName: 'tipi_allegati',
    keys: {},
    index: 0,
    total: 0,
    isNew: true,
    showNavBar: false
};

  constructor(private _formBuilder: FormBuilder,
    public dialogRef: MatDialogRef<AttachDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fileService: FileManagerService,
    private backendService: BackendService,
    private httpClient: HttpClient) {
        const questo = this; 
        // Reactive Form
        questo.form = questo._formBuilder.group({
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

        questo.fileService.onFileAdd.subscribe(result => {
            
            if (questo.data.keys.codice_azienda == null) {
                questo.data.keys['codice_azienda'] =  questo.data.keys.codice_part; // hack as tipi_allegati uses codice_azienda
            }
            questo.newTypeParams.keys = questo.data.keys;
            questo.attach = true;
        });


        questo.fileService.onFileDownload.subscribe(selected => {
            if (questo.listFiles != null) {
                const fileDesc = questo.listFiles.find(e => e.client_file_name === selected.name);
                if (fileDesc != null) {
                    questo.backendService.getFileURL(questo.data.entryName, questo.data.keys, fileDesc.file_id).subscribe(
                        url => {
                            if (url != null) {
                                questo.httpClient.get(url.url, {responseType: 'blob'}).subscribe(
                                    fileData => {
                                        saveAs(fileData, selected.name);
                                    });
                            }
                        });
                }
            }
        });

        questo.attach = false;
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
        const questo = this;
        console.log(event);
        questo.attach = false;
        if (questo.file != null) {
            // get the S3 URL 
            questo.backendService.createFileURL(questo.data.entryName, questo.data.keys).subscribe(
                responseURL => {
                    console.log(responseURL);
                    if (responseURL != null) {
                        const blob = new Blob([questo.file]);
                        // upload the file using obtained url
                        questo.httpClient.put(responseURL.url, blob).subscribe (
                        responsePut => {
                            console.log('File uploaded with filename: ', responseURL.filename);
                            // retrieve file content
                            const reader = new FileReader();
                            reader.onload = function (e) {
                                const content = reader.result;
                                var buffer = Buffer.alloc(content.byteLength)
                                for (var i = 0; i < content.byteLength; i++) {
                                     buffer[i] = content[i];
                                };
                                // create file content hash
                                const hash = createHash('sha1').update(buffer).digest("hex");
                                console.log(hash);
                                // check that the file has been correctly uploaded and pass file params to the backend
                                const fileParams = {

                                };
                                questo.backendService.checkFile(questo.data.entryName, questo.data.keys, hash, fileParams).subscribe(
                                    responseCheck => {

                                    }
                                )

                            };
                            reader.readAsArrayBuffer(blob);
                        });
                    }
                }
            )
        }
    }

    onNewType(event: any) {

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
