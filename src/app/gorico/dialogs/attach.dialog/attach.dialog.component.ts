import { Component, Inject, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy, ViewChildren, QueryList} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { FileManagerService } from 'app/main/apps/file-manager/file-manager.service';
import { BackendService } from 'app/gorico/views/backend/backend.service';
import { saveAs } from 'file-saver';
import {HttpClient} from '@angular/common/http';
import { FileUploadComponent } from 'app/gorico/file-uploader/file-upload/file-upload.component';
import { createHash } from 'crypto';    // pls. read https://stackoverflow.com/questions/54162297/module-not-found-error-cant-resolve-crypto
                                        // and https://stackoverflow.com/a/54645398 and then 'npm run build'
import { formGetterParams, FormGetterComponent } from 'app/gorico/views/form-getter/form-getter.component';
import { AuthService } from 'app/gorico/login-page/auth.service';
import { Subscription } from 'rxjs';
                                        

@Component({
  selector: 'app-attach.dialog',
  templateUrl: './attach.dialog.component.html',
  styleUrls: ['./attach.dialog.component.scss']
})



export class AttachDialogComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('fileUploader') fileUploader: FileUploadComponent;

  @ViewChild('formRef') formRef: FormGetterComponent;

  // tslint:disable-next-line: max-line-length
  @ViewChildren('newTypeRef') newTypeRef: QueryList<FormGetterComponent>;  // see https://expertcodeblog.wordpress.com/2018/01/12/angular-resolve-error-viewchild-annotation-returns-undefined/
  
  attach: boolean;

  progress: number;

  form: FormGroup;

  listFiles: any[];

  file: File;

  subscriptions: Subscription[] = []; 

  newTypeSubscription: Subscription;  

  currentKeys: any;

  formParams: formGetterParams = {
      entryName: 'fe_attachment_form',
      keys: {},
      isNew: true,
      isVisible: true
  };

  newTypeParams: formGetterParams = {
    entryName: 'tipi_allegati',
    keys: {},
    isNew: true,
    isVisible: false
};

  constructor(private _formBuilder: FormBuilder,
    public dialogRef: MatDialogRef<AttachDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fileService: FileManagerService,
    private backendService: BackendService,
    private httpClient: HttpClient,
    private authService: AuthService) {

        const _this = this; 

        _this.fileService.onFileAdd.subscribe(result => {
            
            // recover attachment types
            for (const key in _this.data.keys) { 
                if (_this.data.keys.hasOwnProperty(key)) {
                    const element = _this.data.keys[key];
                    _this.newTypeParams.keys[key] = element;
                }
            }
            if (_this.newTypeParams.keys.codice_azienda == null ) { // hack, tipi_allegati requires this field
                _this.newTypeParams.keys.codice_azienda = _this.newTypeParams.keys.codice_part;
            }
            _this.attach = true;
        });


        _this.fileService.onFileDownload.subscribe(selected => {
            if (_this.listFiles != null) {
                const fileDesc = _this.listFiles.find(e => e.client_file_name === selected.name);
                if (fileDesc != null) {
                    _this.backendService.getFileURL(_this.data.entryName, _this.data.keys, fileDesc.file_id).subscribe(
                        url => {
                            if (url != null) {
                                _this.httpClient.get(url.url, {responseType: 'blob'}).subscribe(
                                    fileData => {
                                        saveAs(fileData, selected.name);
                                    });
                            }
                        });
                }
            }
        });

        // prepare the key for the attachment form
        for (const key in _this.data.keys) {
            if (_this.data.keys.hasOwnProperty(key)) {
                const element = _this.data.keys[key];
                // hack, fe_attachment_form needs this field
                if (key === 'codice_part') {
                    _this.formParams.keys['codice_azienda'] = element;
                } else {
                    _this.formParams.keys[key] = element;
                }
            }
        }
        _this.attach = false;
    }

    ngOnInit() {

        this.backendService.getAttachList(this.data.entryName, this.data.keys).subscribe(
            result => {
                console.log(result);
                if (result.result === 'OK') {
                    this.listFiles = result.data.list;
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
                            };
                            files.push(file);
                        });
                    }
                    this.fileService.files = files;
                    this.fileService.getFiles();
                }
            });

        this.progress = 0;
    }

    ngAfterViewInit() {
        var _this = this;
        if (_this.fileUploader != null) {
            _this.fileUploader.registerOnChange(function (file: File): void {
                _this.file = file;
                _this.form = _this.formRef.formArray.first.form; // getting the FormGroup
                _this.form.patchValue({ fileName: file.name, dimension: file.size });
            });
        }
        let ext_subscription = _this.newTypeRef.changes.subscribe(
            (comps: QueryList<FormGetterComponent>) => {
                if (_this.newTypeSubscription == null) {  // subscribe only first time 
                    _this.newTypeSubscription = comps.first.sendEvent.subscribe(
                        event => {
                            if (event.eventType === 'formData' || event.eventType === 'updateKeys') {
                                _this.currentKeys = event.viewKeys;
                            }
                        }
                    );
                    _this.subscriptions.push(_this.newTypeSubscription);
                }
            });
        _this.subscriptions.push(ext_subscription);
    };

    ngOnDestroy() {
        this.subscriptions.forEach(subscription => {
            subscription.unsubscribe();
        });
    }

    onSave(): void {
        const _this = this;
        console.log(event);
        _this.attach = false;
        if (_this.file != null) {
            // get the S3 URL 
            _this.backendService.createFileURL(_this.data.entryName, _this.data.keys).subscribe(
                responseURL => {
                    console.log(responseURL);
                    if (responseURL != null  && responseURL.response === 'OK') {
                        responseURL = responseURL.data;
                        const blob = new Blob([_this.file]);
                        // upload the file using obtained url
                        _this.httpClient.put(responseURL.url, blob).subscribe (
                        responsePut => {
                            console.log('File uploaded with filename: ', responseURL.filename);
                            // retrieve file content
                            const reader = new FileReader();
                            reader.onload = function (e) {
                                const content = reader.result;
                                /*
                                var buffer = Buffer.alloc(content.byteLength);
                                for (var i = 0; i < content.byteLength; i++) {
                                     buffer[i] = content[i];
                                };*/
                                var buffer = Buffer.from(content);
                                // create file content hash
                                const hash = createHash('sha1').update(buffer).digest("hex");
                                console.log(hash);
                                // check that the file has been correctly uploaded and pass file params to the backend
                                var mime = require('mime-types');
                                const fileParams = {
                                    nickname: _this.form.value.fileName,
                                    descrizione: _this.form.value.description,
                                    url: _this.form.value.docURL,
                                    descrizione_breve: _this.form.value.shortDesc,
                                    content_type: mime.lookup(_this.form.value.fileName),
                                    // id_tipo_allegato: _this.form.value.type.value,
                                    id_tipo_allegato: 2,
                                    dimensione: _this.form.value.dimension,
                                    autore: _this.authService.getUsername
                                };
                                _this.backendService.checkFile(_this.data.entryName, _this.data.keys, hash, responseURL.filename, fileParams).subscribe(
                                    responseCheck => {
                                        console.log(responseCheck);
                                    }
                                );

                            };
                            reader.readAsArrayBuffer(blob);
                        });
                    }
                }
            )
        }
    }

    onNewType(event: any) {
        let values = this.newTypeRef.first.formArray.first.form.value; // get the form data
        // process the booleans (1/0 instead of true/false)
        for (const value in values) {
            if (values.hasOwnProperty(value)) {
                const element = values[value];
                if (element == null) {
                    continue; // skip null entries
                }
                // decode combos
                if (element['id'] != null) {
                    values[value] = element['id'];
                }
                // encode boolean
                else if (element === true) {
                    values[value] = '1';
                } 
                else if (element === false) {
                    values[value] = '0';
                }
            }
        }
        this.backendService.updateData(this.newTypeParams.entryName, this.authService.getCurrentCompany(), this.currentKeys, [values]).subscribe(  // backend expects an array of data
            result => {
                this.newTypeParams.isVisible = false; // hide the view 
                setTimeout(() => {
                    this.formRef.refreshView();          // refresh the combobox
                    this.newTypeRef.first.loadTableData(); // load next ID 
                }, 500); // reload the table after having added the new type
            }
        );
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
