import { Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FileManagerService } from 'app/main/apps/file-manager/file-manager.service';
import { BackendService } from 'app/gorico/views/backend/backend.service';
import { saveAs } from 'file-saver';
import {HttpClient} from "@angular/common/http";
import { ResponseType } from '@angular/http';

@Component({
  selector: 'app-attach.dialog',
  templateUrl: './attach.dialog.component.html',
  styleUrls: ['./attach.dialog.component.scss']
})



export class AttachDialogComponent {

  attach: boolean;

  progress: number;

  form: FormGroup;

  listFiles: any[];

  constructor(private _formBuilder: FormBuilder,
    public dialogRef: MatDialogRef<AttachDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fileService: FileManagerService,
    private backendService: BackendService,
    private httpClient: HttpClient) { 

        
        this.backendService.getAttachList(data.entryName, data.keys).subscribe(
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
        

        // Reactive Form
        this.form = this._formBuilder.group({
            id   : [
                {
                    value   : 24,
                    disabled: true
                }, Validators.required
            ],
            nomeFile  : ['', Validators.required],
            dimensione   : [
                {
                    value: 0,
                    disabled: true
                }, Validators.required
            ],
            docURL    : [''],
            descBreve : [''],
            descrizione  : [''],
            tipo   : ['']
        });

        this.fileService.onFileAdd.subscribe(result => {
            this.attach = true;
        });

        this.fileService.onFileDownload.subscribe(selected => {
            if (this.listFiles != null) {
                const fileDesc = this.listFiles.find(e => e.client_file_name === selected.name);
                if (fileDesc != null) {
                    this.backendService.getFileURL(data.entryName, data.keys, fileDesc.file_id).subscribe(
                        url => {
                            if (url != null) {
                                this.httpClient.get(url.url, {responseType: 'blob'}).subscribe(
                                    data => {
                                        saveAs(data, selected.name);
                                    });
                            }
                        });
                }
            }
        });

        this.attach = false;

        this.progress = 0;
    }

    onSave(): void {
        this.attach = false;
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
