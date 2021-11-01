import { Component, Inject, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy, ViewChildren, QueryList } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup } from '@angular/forms';
import { saveAs } from 'file-saver';
import { HttpClient } from '@angular/common/http';
import { FileUploadComponent } from 'app/oc/file-uploader/file-upload/file-upload.component';
// import { createHash } from 'crypto';    // pls. read https://stackoverflow.com/questions/54162297/module-not-found-error-cant-resolve-crypto
// and https://stackoverflow.com/a/54645398 and then 'npm run build'
import * as CryptoJS from 'crypto-js';

import { FormGetterComponent } from 'app/oc/views/form-getter/form-getter.component';
import { Subscription } from 'rxjs';
import { FormGetterParams } from 'app/oc/interfaces';
import { FileManagerService } from 'app/main/apps/file-manager/file-manager.service';
import { AuthService, BackendService, ConsoleLoggerService, EncryptionService, ToastService } from 'app/oc/services';



@Component({
    selector: 'app-attach.dialog',
    templateUrl: './attach.dialog.component.html',
    styleUrls: ['./attach.dialog.component.scss']
})



export class AttachDialogComponent implements OnInit, AfterViewInit, OnDestroy {

    @ViewChild('fileUploader', { static: true }) fileUploader: FileUploadComponent;

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

    formParams: FormGetterParams = {
        entryName: 'fe_attachment_form',
        keys: {},
        isNew: true,
        isVisible: true
    };

    newTypeParams: FormGetterParams = {
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
        private authService: AuthService,
        private _toastService: ToastService,
        private _console: ConsoleLoggerService,
        private _encryptionService: EncryptionService) {

        const _this = this;

        let subscription = _this.fileService.onFileAdd.subscribe(result => {

            // recover attachment types
            for (const key in _this.data.keys) {
                if (_this.data.keys.hasOwnProperty(key)) {
                    const element = _this.data.keys[key];
                    _this.newTypeParams.keys[key] = element;
                }
            }
            if (_this.newTypeParams.keys.codice_azienda == null) { // hack, tipi_allegati requires this field
                _this.newTypeParams.keys.codice_azienda = _this.newTypeParams.keys.codice_part;
            }
            _this.attach = true;
        });

        _this.subscriptions.push(subscription);

        subscription = _this.fileService.onFileDownload.subscribe(selected => {
            if (_this.listFiles != null) {
                const fileDesc = _this.listFiles.find(e => e.client_file_name === selected.name);
                if (fileDesc != null) {
                    _this.backendService.getFileURL(_this.data.entryName, _this.authService.getCurrentCompany(_this.data.keys), _this.data.keys, fileDesc.file_id).subscribe(
                        url => {
                            if (url != null) {
                                _this.subscriptions.push(_this.httpClient.get(url.url, { responseType: 'blob' }).subscribe(
                                    fileData => {
                                        saveAs(fileData, selected.name);
                                    })
                                );
                            }
                        });
                }
            }
        });

        _this.subscriptions.push(subscription);

        subscription = _this.fileService.onFileDelete.subscribe(selected => {
            if (_this.listFiles != null) {
                const fileDesc = _this.listFiles.find(e => e.client_file_name === selected.name);
                if (fileDesc != null) {
                    _this.backendService.deleteFile(_this.data.entryName, _this.authService.getCurrentCompany(_this.data.keys), selected.id_risorsa, selected.file_id, _this.data.keys).subscribe(
                        urlResponse => {
                            if (urlResponse.result == 'OK') {
                                _this._console.table(urlResponse);
                                _this.httpClient.delete(urlResponse.url).subscribe(
                                    fileData => {
                                            _this._toastService.showSuccessToast("File deleted successfully!");
                                            _this.fileService.requestReload(_this.data.entryName);
                                    });
                            }
                            else {
                                _this._toastService.showErrorToast(urlResponse.reason);
                            }
                        },
                        err => {
                            _this._console.error(err);
                            _this._toastService.showErrorToast(err);
                        });
                }
            }
        });

        _this.subscriptions.push(subscription);

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
        const _this = this;
        // Subscribe to reload Request
        _this.subscriptions.push(_this.fileService.reloadNeeded.subscribe(entryName => {
            if (entryName === _this.data.entryName) {
                _this.getAttachList();
            }
        }));
        // Get Attach list
        _this.getAttachList();
    }

    ngAfterViewInit() {
        var _this = this;
        if (_this.fileUploader != null) {
            _this.fileUploader.registerOnChange(function (file: File): void {
                _this.file = file;
                _this.form = _this.formRef.formArray.first.form; // getting the FormGroup
                _this.form.patchValue({ fileName: file.name, dimensione: file.size });
                _this.onFileSelected();
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
    }

    ngOnDestroy() {
        this.subscriptions.forEach(subscription => {
            subscription.unsubscribe();
        });
    }

    getAttachList() {
        const subscription = this.backendService.getAttachList(this.data.entryName, this.authService.getCurrentCompany(this.data.keys), this.data.keys).subscribe(
            result => {
                this._console.log(result);
                if (result.result === 'OK') {
                    this.listFiles = result.list;
                    const files = [];
                    if (this.listFiles) {
                        this.listFiles.forEach(element => {
                            const file = {
                                'name': element.client_file_name,
                                'file_id': element.file_id,
                                'id_risorsa': element.id_risorsa,
                                'type': 'document',
                                'owner': element.autore,
                                'size': this.fileService.getFileSize(element.dimensione),
                                'modified': new Date(element.data_upd || element.data_ultima_revisione).toString(),
                                'opened': new Date(element.data_ins || element.data_ultima_accesso).toString(),
                                'created': new Date(element.data_creazione).toString(),
                                'extention': '',
                                'location': '',
                                'offline': true
                            };
                            files.push(file);
                        });
                    }
                    this.fileService.files = files;
                    this.fileService.getFiles();
                }
                else {
                    // Show error snackbar
                    this._toastService.showErrorToast(result.reason);
                }
            });

        this.subscriptions.push(subscription);

        this.progress = 0;
    }

    onSave(): void {
        const _this = this;
        _this._console.log(event);
        _this.attach = false;
        if (_this.file != null) {
            // get the S3 URL 
            const subscription = _this.backendService.createFileURL(_this.data.entryName, _this.authService.getCurrentCompany(_this.data.keys), _this.data.keys).subscribe(
                responseURL => {
                    _this._console.log(responseURL);
                    if (responseURL != null && responseURL.result === 'OK') {
                        const blob = new Blob([_this.file]);
                        // upload the file using obtained url
                        _this.httpClient.put(responseURL.url, blob).subscribe(
                            responsePut => {
                                _this._console.log('File uploaded with filename: ', responseURL.filename);
                                // retrieve file content
                                const reader = new FileReader();
                                reader.onload = function (e) {
                                    const content = reader.result;
                                    /*
                                    var buffer = Buffer.alloc(content.byteLength);
                                    for (var i = 0; i < content.byteLength; i++) {
                                         buffer[i] = content[i];
                                    };*/
                                    // create file content hash
                                    // Old method
                                    // var buffer = Buffer.from(<string>content);
                                    // const hash = createHash('sha1').update(buffer).digest("hex");
                                    // New methd by Zee
                                    const hash = CryptoJS.SHA1(_this._encryptionService.arrayBufferToWordArray(content)).toString(CryptoJS.enc.Hex);
                                    _this._console.log(hash);
                                    // check that the file has been correctly uploaded and pass file params to the backend
                                    var mime = require('mime-types');
                                    const fileParams = {
                                        nickname: _this.form.value.fileName,
                                        descrizione: _this.form.value.descrizione,
                                        data_scadenza: _this.form.value.data_scadenza,
                                        data_rif: _this.form.value.data_rif,
                                        url: _this.form.value.url,
                                        descrizione_breve: _this.form.value.descrizione_breve,
                                        content_type: mime.lookup(_this.form.value.fileName),
                                        id_odg: _this.form.value.id_odg != null ? _this.form.value.id_odg.id : null,
                                        id_riunione: _this.form.value.id_riunione != null ? _this.form.value.id_riunione.id : null,
                                        id_centro_gest:  _this.form.value.id_centro_gest != null ? _this.form.value.id_centro_gest.id : null,
                                        id_argomento_tipo_allegato: _this.form.value.id_argomento_tipo_allegato != null ? _this.form.value.id_argomento_tipo_allegato.id : null,                                        
                                        dimensione: _this.form.value.dimensione,
                                        autore: _this.authService.getUsername()
                                    };
                                    _this.backendService.checkFile(_this.data.entryName, _this.authService.getCurrentCompany(_this.data.keys), _this.data.keys, hash, responseURL.filename, fileParams).subscribe(
                                        responseCheck => {
                                            if(responseCheck.result === 'OK' || responseCheck.reason == 'File already loaded!')
                                            {
                                                _this.fileService.requestReload(_this.data.entryName);
                                                _this._console.log(responseCheck);
                                                // Show success snackbar
                                                _this._toastService.showSuccessToast("File uploaded successfully!");
                                            }
                                            else {
                                                // Show error snackbar
                                                _this._toastService.showErrorToast(responseCheck.reason);
                                            }
                                            
                                        },
                                        error => {
                                            // Show error snackbar
                                            _this._toastService.showErrorToast(error);
                                        }
                                    );

                                };
                                reader.readAsArrayBuffer(blob);
                            });
                    }
                    else {
                        // Show error snackbar
                        _this._toastService.showErrorToast(responseURL.reason);
                    }
                }
            );

            this.subscriptions.push(subscription);
        }
    }

    onFileSelected() {
        let _this = this;
        const blob = new Blob([_this.file]);
                        
        const reader = new FileReader();
        reader.onload = function (e) {
            const content = reader.result;
            const hash = CryptoJS.SHA1(_this._encryptionService.arrayBufferToWordArray(content)).toString(CryptoJS.enc.Hex);
            _this._console.log(hash);
            
            _this.backendService.loadFileDataIfExists(_this.data.entryName, _this.authService.getCurrentCompany(_this.data.keys), _this.data.keys, hash).subscribe(
                responseCheck => {
                    if(responseCheck.result === 'OK')
                    {
                        let data = responseCheck.data;
                        _this.form = _this.formRef.formArray.first.form; // getting the FormGroup
                        _this.form.patchValue(
                            {
                                descrizione_breve: data.descrizione_breve,
                                descrizione: data.descrizione,
                                data_scadenza: data.data_scadenza,
                                docURL: data.url,
                                content_type: data.content_type,
                                id_odg: data.id_odg,
                                id_riunione: data.id_riunione,
                                id_centro_gest: data.id_centro_gest,
                                id_argomento_tipo_allegato: data.id_argomento_tipo_allegato,
                                data_rif: data.data_rif,
                                //type: 
                                //key:  
                                //codice_azienda:
                                //codice_part: 
                                //fileName: 
                                //dimension: 
                                //addType

                            }
                            // {
                            //    codice_part: data.codice_part,
                            //     content_type: data.content_type,
                            //     data_creazione: data.data_creazione,
                            //     data_ins: data.data_ins,
                            //     data_rif: data.data_rif,
                            //     data_scadenza: data.data_scadenza,
                            //     data_ultima_revisione: data.data_ultima_revisione,
                            //     data_ultimo_accesso: data.data_ultimo_accesso,
                            //     data_upd: data.data_upd,
                            //     descrizione: data.descrizione,
                            //     descrizione_breve: data.descrizione_breve,
                            //     filtro_dati: data.filtro_dati,
                            //     flag_indexed: data.flag_indexed,
                            //     flag_link: data.flag_link,
                            //     flag_verifica: data.flag_verifica,
                            //     id_argomento: data.id_argomento,
                            //     id_argomento_tipo_allegato: data.id_argomento_tipo_allegato,
                            //     id_centro_gest: data.id_centro_gest,
                            //     id_odg: data.id_odg,
                            //     id_risorsa: data.id_risorsa,
                            //     id_riunione: data.id_riunione,
                            //     id_tipo_allegato: data.id_tipo_allegato,
                            //     nickname: data.nickname,

                            //     nome_vista: data.nome_vista,
                            //     ordinamento_dati: data.ordinamento_dati,
                            //     parole_chiave: data.parole_chiave,

                            //     revisione_corrente: data.revisione_corrente,
                            //     tag: data.tag,
                            //     template_name: data.template_name,
                            //     ts_cestinato: data.ts_cestinato,
                            //     ts_checkout: data.ts_checkout,
                            //     ts_ultima_modifica: data.ts_ultima_modifica,
                            //     url: data.url,
                            //     ute_ins: data.ute_ins,
                            //     ute_upd: data.ute_upd,
                            //     utente_checkout: data.utente_checkout,
                            //     utente_ultimo_accesso: data.utente_ultimo_accesso,
                            //     utenti_esclusi: data.utenti_esclusi,
                            // }
                        );
                        // _this.fileService.requestReload(_this.data.entryName);
                        _this._console.log(responseCheck);
                        // Show success snackbar
                        // _this._toastService.showSuccessToast("File already loaded!");
                    }
                    else {
                        // Show error snackbar
                        _this._toastService.showErrorToast(responseCheck.reason);
                    }
                    
                },
                error => {
                    // Show error snackbar
                    _this._toastService.showErrorToast(error);
                }
            );

        };
        reader.readAsArrayBuffer(blob);


        
    }

    onNewType(event: any) {
        const values = this.newTypeRef.first.formArray.first.form.value; // get the form data
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
        const subscription = this.backendService.updateData(this.newTypeParams.entryName, this.authService.getCurrentCompany(this.data.keys), this.currentKeys, [values]).subscribe(  // backend expects an array of data
            result => {
                this.newTypeParams.isVisible = false; // hide the view 
                setTimeout(() => {
                    this.formRef.refreshView();          // refresh the combobox
                    this.newTypeRef.first.loadTableData(); // load next ID 
                }, 500); // reload the table after having added the new type
            }
        );

        this.subscriptions.push(subscription);
    }




}
