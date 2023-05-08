import { Component, Inject, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy, ViewChildren, QueryList } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { saveAs } from 'file-saver';
import { MultiFileUploadComponent } from 'app/oc/file-uploader/multi-file-upload/multi-file-upload.component';
import { HttpClient } from '@angular/common/http';
// import * as CryptoJS from 'crypto-js';
import * as sha1 from 'js-sha1';
import * as md5 from 'blueimp-md5';

import { FormGetterComponent } from 'app/oc/views/form-getter/form-getter.component';
import { Subscription } from 'rxjs';
import { FormGetterParams } from 'app/oc/interfaces';
import { FileManagerService } from 'app/main/apps/file-manager/file-manager.service';
import { AuthService, BackendService, ConsoleLoggerService, EncryptionService, ToastService } from 'app/oc/services';

@Component({
    selector: 'app-multi-attachments.dialog',
    templateUrl: './multi-attachments.dialog.component.html',
    styleUrls: ['./multi-attachments.dialog.component.scss']
})



export class MultiAttachmentsDialogComponent implements OnInit, AfterViewInit, OnDestroy {

    @ViewChild('fileUploader', { static: true }) fileUploader: MultiFileUploadComponent;

    @ViewChild('formRef') formRef: FormGetterComponent;

    // tslint:disable-next-line: max-line-length
    @ViewChildren('newTypeRef') newTypeRef: QueryList<FormGetterComponent>;  // see https://expertcodeblog.wordpress.com/2018/01/12/angular-resolve-error-viewchild-annotation-returns-undefined/

    attach: boolean;
    isSaving: boolean;
    progress: number;

    form: UntypedFormGroup;

    listFiles: any[];

    files: File[];

    subscriptions: Subscription[] = [];

    newTypeSubscription: Subscription;

    currentKeys: any;

    formParams: FormGetterParams = {
        entryName: 'fe_multi_attachment_form',
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

    savingFiles: boolean = false;
    filesSaved: number = 0;

    constructor(private _formBuilder: UntypedFormBuilder,
        public dialogRef: MatDialogRef<MultiAttachmentsDialogComponent>,
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
                _this.newTypeParams.keys.codice_azienda = _this.authService.getCurrentCompany();
                //_this.newTypeParams.keys.codice_part;
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
                    _this.backendService.deleteFile(_this.data.entryName, _this.authService.getCurrentCompany(_this.data.keys), selected.id_risorsa, selected.file_id, selected.prog_revisione, _this.data.keys).subscribe(
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
                    _this.formParams.keys['codice_azienda'] = _this.authService.getCurrentCompany(); //element;
                    // hack, fe_attachment_form pick up the value of 'descrizione' if we attach from domande(incorrect) [maybe because they have the same name_key ('descrizione' in fe_att and domande) ]
                } else if (key === 'descrizione') {
                    _this.formParams.keys[key] = '';
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
            _this.fileUploader.registerOnChange(function (files: File[]): void {
                _this.files = files;
                _this.form = _this.formRef.formArray.first.form; // getting the FormGroup
                _this.form.patchValue({ fileName: files[0].name, dimensione: files[0].size });
                // _this.onFileSelected();
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
        const subscription = this.backendService.getAttachList(this.data.entryName, this.authService.getCurrentCompany(this.data.keys), this.data.keys, this.data.businessObjectName).subscribe(
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
                                'prog_revisione': element.prog_revisione,
                                'type': 'document',
                                'owner': element.revisore,
                                'size': this.fileService.getFileSize(element.dimensione),
                                'modified': new Date(element.data_ultima_revisione || element.data_creazione).toLocaleString(),
                                'opened': new Date(element.data_ins || element.data_ultima_accesso).toLocaleString(),
                                'created': new Date(element.data_creazione).toLocaleString(),
                                'extention': '',
                                'location': '',
                                'offline': true,
                                'rifDate': new Date(element.data_rif_a).toLocaleDateString()
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

    async onSave() {
        const _this = this;
        _this.attach = false;
        if (_this.files != null && _this.files.length > 0) {
            _this.isSaving = true;
            _this.savingFiles = true;
            _this.filesSaved = 0;
            let i = 0;
            await _this.saveFile(i);
        }
    }

    async saveFile(i: number = 0) {
        let _this = this;
        try {
            // get the S3 URL 
            let responseURL: any = await _this.backendService.createFileURL(_this.data.entryName, _this.authService.getCurrentCompany(_this.data.keys), _this.data.keys).toPromise();
            _this._console.log(responseURL);
            if (responseURL != null && responseURL.result === 'OK') {
                const blob = new Blob([_this.files[i]]);
                // upload the file using obtained url
                let responsePut: any = await _this.httpClient.put(responseURL.url, blob).toPromise();
                _this._console.log('File uploaded with filename: ', responseURL.filename);
                // retrieve file content
                const content = await _this.files[i]?.arrayBuffer();
                const hash = sha1(content);
                const md5hash = md5(content);
                // const hash = CryptoJS.SHA1(_this._encryptionService.arrayBufferToWordArray(content)).toString(CryptoJS.enc.Hex);
                // const md5hash = CryptoJS.MD5(_this._encryptionService.arrayBufferToWordArray(content)).toString(CryptoJS.enc.Hex);
                _this._console.log(hash);
                // check that the file has been correctly uploaded and pass file params to the backend
                var mime = require('mime-types');
                const fileParams = {
                    nickname: _this.files[i].name,// _this.form.value.fileName != null ? _this.form.value.fileName : null,
                    descrizione: _this.form.value.descrizione != null ? _this.form.value.descrizione : null,
                    data_scadenza: _this.form.value.data_scadenza != null ? _this.form.value.data_scadenza : null,
                    data_rif: _this.form.value.data_rif != null ? _this.form.value.data_rif : null,
                    url: _this.form.value.url != null ? _this.form.value.url : null,
                    descrizione_breve: _this.form.value.descrizione_breve != null ? _this.form.value.descrizione_breve : null,
                    content_type: mime.lookup(_this.form.value.fileName),
                    id_odg: _this.getValue(_this.form.value.id_odg), //_this.form.value.id_odg != null ? _this.form.value.id_odg.id : null,
                    id_riunione: _this.getValue(_this.form.value.id_riunione), //_this.form.value.id_riunione != null ? _this.form.value.id_riunione.id : null,
                    id_centro_gest: _this.getValue(_this.form.value.id_centro_gest), //_this.form.value.id_centro_gest != null ? _this.form.value.id_centro_gest.id : null,
                    id_argomento_tipo_allegato: _this.getValue(_this.form.value.id_argomento_tipo_allegato), //_this.form.value.id_argomento_tipo_allegato != null ? _this.form.value.id_argomento_tipo_allegato.id : null,
                    dimensione: _this.getValue(_this.form.value.dimensione), //_this.form.value.dimensione != null ? _this.form.value.dimensione : null,
                    id_anagrafica: _this.getValue(_this.form.value.id_anagrafica), //_this.form.value.id_anagrafica != null ? _this.form.value.id_anagrafica.id : null,
                    id_somministrazione: _this.getValue(_this.form.value.id_somministrazione), //_this.form.value.id_somministrazione != null ? _this.form.value.id_somministrazione.id : null,
                    id_sondaggio: _this.getValue(_this.form.value.id_sondaggio), //_this.form.value.id_sondaggio != null ? _this.form.value.id_sondaggio.id : null,
                    id_progetto: _this.getValue(_this.form.value.id_progetto), //_this.form.value.id_progetto != null ? _this.form.value.id_progetto.id : null,
                    prog_revisione: _this.getValue(_this.form.value.prog_revisione), //_this.form.value.prog_revisione != null ? _this.form.value.prog_revisione.id : null,
                    id_risorsa: _this.getValue(_this.form.value.id_risorsa), //_this.form.value.id_risorsa != null ? _this.form.value.id_risorsa.id : null,
                    id_domanda: _this.getValue(_this.form.value.id_domanda), //_this.form.value.id_domanda != null ? _this.form.value.id_domanda.id : null,
                    id_modello_test: _this.getValue(_this.form.value.id_modello_test), //_this.form.value.id_modello_test != null ? _this.form.value.id_modello_test.id : null,
                    id_modello_test_vr: _this.getValue(_this.form.value.id_modello_test_vr), //_this.form.value.id_modello_test_vr != null ? _this.form.value.id_modello_test_vr.id : null,
                    codice_compito: _this.getValue(_this.form.value.codice_compito), //_this.form.value.codice_compito != null ? _this.form.value.codice_compito.id : null,
                    autore: _this.authService.getUsername(),
                    businessObjectName: _this.data.businessObjectName
                };
                let responseCheck: any = await _this.backendService.checkFile(_this.data.entryName, _this.authService.getCurrentCompany(_this.data.keys), _this.data.keys, hash, md5hash, responseURL.filename, fileParams).toPromise();
                _this._console.log(responseCheck);
                if (responseCheck.result === 'OK' || responseCheck.reason == 'File already loaded!') {
                    if (_this.authService.getSyncMode() === 'google') {
                        const googleDriveFileCopyParamsResponse: any = await _this.backendService.getGoogleDriveFileCopyParams(_this.authService.getCurrentCompany(_this.data.keys), hash).toPromise();
                        _this._console.log(googleDriveFileCopyParamsResponse);
                        _this._console.log('Uploading to google');
                        try {
                            if (googleDriveFileCopyParamsResponse.result === 'OK') {
                                if (googleDriveFileCopyParamsResponse.response && googleDriveFileCopyParamsResponse.response.rows && googleDriveFileCopyParamsResponse.response.rows[0]) {
                                    let auth = await _this.authService.loadGoogleAuth('gdrive');
                                    let googledrivepath = googleDriveFileCopyParamsResponse.response.rows[0].googledrivepath;
                                    let s3path = googleDriveFileCopyParamsResponse.response.rows[0].s3path;
                                    const copyFromS3ToDriveResponse: any = await _this.backendService.copyFromS3ToDrive(s3path, googledrivepath, auth).toPromise();
                                    _this._console.log(googledrivepath, s3path);
                                    _this._console.log(copyFromS3ToDriveResponse);
                                }
                            }
                        }
                        catch (e) {
                            _this._console.error("Google upload error: ", e);
                        }
                    }

                    // Show success snackbar
                    if (responseCheck.reason === 'File already loaded!') {
                        _this._toastService.showInfoToast("File already loaded");
                    }
                    else {
                        _this._toastService.showSuccessToast("File uploaded successfully");
                    }
                    if (i < _this.files.length - 1) {
                        _this.saveFile(i + 1);
                    }
                    else {
                        if (_this.data.onSave) {
                            _this.data.onSave(true);
                        }
                        _this.isSaving = false;
                        _this.fileService.requestReload(_this.data.entryName);
                    }
                }
                else {
                    // Show error snackbar
                    _this.isSaving = false;
                    _this._toastService.showErrorToast(responseCheck.reason);
                }
            }
            else {
                // Show error snackbar
                _this.isSaving = false;
                _this._toastService.showErrorToast(responseURL.reason);
            }
        }
        catch (e) {
            _this.isSaving = false;
            _this._toastService.showErrorToast(e);
        }
    }

    getValue(val: any) {
        if (val !== null && val !== undefined) {
            if (typeof val === 'object' && !Array.isArray(val)) {
                if (val.id !== null && val.id !== undefined) {
                    if (typeof val.id === 'object' && !Array.isArray(val.id)) {
                        return val.id.id;
                    }
                    else {
                        return val.id;
                    }
                }
            }
            else {
                return val;
            }
        }
        return null;
    }

    // onFileSelected() {
    //     let _this = this;
    //     const blob = new Blob([_this.file]);

    //     const reader = new FileReader();
    //     reader.onload = function (e) {
    //         const content = reader.result;
    //         const hash = CryptoJS.SHA1(_this._encryptionService.arrayBufferToWordArray(content)).toString(CryptoJS.enc.Hex);
    //         _this._console.log(hash);

    //         _this.backendService.loadFileDataIfExists(_this.data.entryName, _this.authService.getCurrentCompany(_this.data.keys), _this.data.keys, hash).subscribe(
    //             responseCheck => {
    //                 if (responseCheck.result === 'OK') {
    //                     let data = responseCheck.data;
    //                     _this.form = _this.formRef.formArray.first.form; // getting the FormGroup
    //                     _this.form.patchValue(
    //                         {
    //                             descrizione_breve: data.descrizione_breve,
    //                             descrizione: data.descrizione,
    //                             data_scadenza: data.data_scadenza,
    //                             docURL: data.url,
    //                             content_type: data.content_type,
    //                             id_odg: data.id_odg,
    //                             id_riunione: data.id_riunione,
    //                             id_centro_gest: data.id_centro_gest,
    //                             id_argomento_tipo_allegato: data.id_argomento_tipo_allegato,
    //                             data_rif: data.data_rif,
    //                             id_anagrafica: data.id_anagrafica,
    //                             id_somministrazione: data.id_somministrazione,
    //                             id_sondaggio: data.id_sondaggio,
    //                             id_progetto: data.id_progetto,
    //                             prog_revisione: data.prog_revisione,
    //                             id_risorsa: data.id_risorsa,
    //                             id_domanda: data.id_domanda,
    //                             id_modello_test: data.id_modello_test,
    //                             id_modello_test_vr: data.id_modello_test_vr
    //                             //type: 
    //                             //key:  
    //                             //codice_azienda:
    //                             //codice_part: 
    //                             //fileName: 
    //                             //dimension: 
    //                             //addType

    //                         }
    //                         // {
    //                         //    codice_part: data.codice_part,
    //                         //     content_type: data.content_type,
    //                         //     data_creazione: data.data_creazione,
    //                         //     data_ins: data.data_ins,
    //                         //     data_rif: data.data_rif,
    //                         //     data_scadenza: data.data_scadenza,
    //                         //     data_ultima_revisione: data.data_ultima_revisione,
    //                         //     data_ultimo_accesso: data.data_ultimo_accesso,
    //                         //     data_upd: data.data_upd,
    //                         //     descrizione: data.descrizione,
    //                         //     descrizione_breve: data.descrizione_breve,
    //                         //     filtro_dati: data.filtro_dati,
    //                         //     flag_indexed: data.flag_indexed,
    //                         //     flag_link: data.flag_link,
    //                         //     flag_verifica: data.flag_verifica,
    //                         //     id_argomento: data.id_argomento,
    //                         //     id_argomento_tipo_allegato: data.id_argomento_tipo_allegato,
    //                         //     id_centro_gest: data.id_centro_gest,
    //                         //     id_odg: data.id_odg,
    //                         //     id_risorsa: data.id_risorsa,
    //                         //     id_riunione: data.id_riunione,
    //                         //     id_tipo_allegato: data.id_tipo_allegato,
    //                         //     nickname: data.nickname,

    //                         //     nome_vista: data.nome_vista,
    //                         //     ordinamento_dati: data.ordinamento_dati,
    //                         //     parole_chiave: data.parole_chiave,

    //                         //     revisione_corrente: data.revisione_corrente,
    //                         //     tag: data.tag,
    //                         //     template_name: data.template_name,
    //                         //     ts_cestinato: data.ts_cestinato,
    //                         //     ts_checkout: data.ts_checkout,
    //                         //     ts_ultima_modifica: data.ts_ultima_modifica,
    //                         //     url: data.url,
    //                         //     ute_ins: data.ute_ins,
    //                         //     ute_upd: data.ute_upd,
    //                         //     utente_checkout: data.utente_checkout,
    //                         //     utente_ultimo_accesso: data.utente_ultimo_accesso,
    //                         //     utenti_esclusi: data.utenti_esclusi,
    //                         // }
    //                     );
    //                     // _this.fileService.requestReload(_this.data.entryName);
    //                     _this._console.log(responseCheck);
    //                     // Show success snackbar
    //                     // _this._toastService.showSuccessToast("File already loaded!");
    //                 }
    //                 else {
    //                     // Show error snackbar
    //                     _this._toastService.showErrorToast(responseCheck.reason);
    //                 }

    //             },
    //             error => {
    //                 // Show error snackbar
    //                 _this._toastService.showErrorToast(error);
    //             }
    //         );

    //     };
    //     reader.readAsArrayBuffer(blob);



    // }

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
