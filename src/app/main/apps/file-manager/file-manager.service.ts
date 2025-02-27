import { Injectable, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';
// import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { Observable, BehaviorSubject } from 'rxjs';
import { AuthService, BackendService, ConsoleLoggerService, ToastService } from 'app/oc/services';
import * as sha1 from 'js-sha1';
import * as md5 from 'blueimp-md5';

@Injectable()
export class FileManagerService // implements Resolve<any>
{
    autoOpenFileAddIfEmpty: boolean = true;

    files = [];
    /*
            [
        {
            'name': 'Work Documents',
            'type': 'folder',
            'owner': 'me',
            'size': '',
            'modified': 'July 8, 2017',
            'opened': 'July 8, 2017',
            'created': 'July 8, 2017',
            'extention': '',
            'location': 'My Files > Documents',
            'offline': true
        },
        {
            'name': 'Public Documents',
            'type': 'folder',
            'owner': 'public',
            'size': '',
            'modified': 'July 8, 2017',
            'opened': 'July 8, 2017',
            'created': 'July 8, 2017',
            'extention': '',
            'location': 'My Files > Documents',
            'offline': true
        },
        {
            'name': 'Private Documents',
            'type': 'folder',
            'owner': 'me',
            'size': '',
            'modified': 'July 8, 2017',
            'opened': 'July 8, 2017',
            'created': 'July 8, 2017',
            'extention': '',
            'location': 'My Files > Documents',
            'offline': true
        },
        {
            'name': 'Ongoing projects',
            'type': 'document',
            'owner': 'Emily Bennett',
            'size': '1.2 Mb',
            'modified': 'July 8, 2017',
            'opened': 'July 8, 2017',
            'created': 'July 8, 2017',
            'extention': '',
            'location': 'My Files > Documents',
            'offline': true,
            'preview': 'assets/images/etc/sample-file-preview.jpg'
        },
        {
            'name': 'Shopping list',
            'type': 'document',
            'owner': 'Emily Bennett',
            'size': '980 Kb',
            'modified': 'July 8, 2017',
            'opened': 'July 8, 2017',
            'created': 'July 8, 2017',
            'extention': '',
            'location': 'My Files > Documents',
            'offline': true,
            'preview': 'assets/images/etc/sample-file-preview.jpg'
        },
        {
            'name': 'Invoices',
            'type': 'spreadsheet',
            'owner': 'Emily Bennett',
            'size': '750 Kb',
            'modified': 'July 8, 2017',
            'opened': 'July 8, 2017',
            'created': 'July 8, 2017',
            'extention': '',
            'location': 'My Files > Documents',
            'offline': true,
            'preview': 'assets/images/etc/sample-file-preview.jpg'
        },
        {
            'name': 'Crash logs',
            'type': 'document',
            'owner': 'Emily Bennett',
            'size': '980 Mb',
            'modified': 'July 8, 2017',
            'opened': 'July 8, 2017',
            'created': 'July 8, 2017',
            'extention': '',
            'location': 'My Files > Documents',
            'offline': true,
            'preview': 'assets/images/etc/sample-file-preview.jpg'
        },
        {
            'name': 'System logs',
            'type': 'document',
            'owner': 'Emily Bennett',
            'size': '52 Kb',
            'modified': 'July 8, 2017',
            'opened': 'July 8, 2017',
            'created': 'July 8, 2017',
            'extention': '',
            'location': 'My Files > Documents',
            'offline': true,
            'preview': 'assets/images/etc/sample-file-preview.jpg'
        },
        {
            'name': 'Prices',
            'type': 'spreadsheet',
            'owner': 'Emily Bennett',
            'size': '27 Mb',
            'modified': 'July 8, 2017',
            'opened': 'July 8, 2017',
            'created': 'July 8, 2017',
            'extention': '',
            'location': 'My Files > Documents',
            'offline': true,
            'preview': 'assets/images/etc/sample-file-preview.jpg'
        },
        {
            'name': 'Anabelle Manual',
            'type': 'document',
            'owner': 'Emily Bennett',
            'size': '1.1 Kb',
            'modified': 'July 8, 2017',
            'opened': 'July 8, 2017',
            'created': 'July 8, 2017',
            'extention': '',
            'location': 'My Files > Documents',
            'offline': true,
            'preview': 'assets/images/etc/sample-file-preview.jpg'
        },
        {
            'name': 'Steam summer sale budget',
            'type': 'spreadsheet',
            'owner': 'Emily Bennett',
            'size': '505 Kb',
            'modified': 'July 8, 2017',
            'opened': 'July 8, 2017',
            'created': 'July 8, 2017',
            'extention': '',
            'location': 'My Files > Documents',
            'offline': true,
            'preview': 'assets/images/etc/sample-file-preview.jpg'
        }
    ];
    */
   
    onFilesChanged: BehaviorSubject<any>;
    onFileSelected: BehaviorSubject<any>;
    onFileAdd: BehaviorSubject<any>;
    onFileDownload: BehaviorSubject<any>;
    onFileDelete: BehaviorSubject<any>;

    reloadNeeded: EventEmitter<string> = new EventEmitter();
    onSave: EventEmitter<string> = new EventEmitter();

    /**
     * Constructor
     *
     * @param {HttpClient} _httpClient
     */
    constructor(
        private _httpClient: HttpClient,
        private backendService: BackendService,
        private _toastService: ToastService,
        private _console: ConsoleLoggerService,
        private authService: AuthService,
        private httpClient: HttpClient
    ) {
        // Set the defaults
        this.onFilesChanged = new BehaviorSubject({});
        this.onFileSelected = new BehaviorSubject({});
        this.onFileAdd = new BehaviorSubject({});
        this.onFileDownload = new BehaviorSubject({});
        this.onFileDelete = new BehaviorSubject({});

    }

    /**
     * Resolver
     *
     * @param {ActivatedRouteSnapshot} route
     * @param {RouterStateSnapshot} state
     * @returns {Observable<any> | Promise<any> | any}
     *
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> | Promise<any> | any
    {
        return new Promise((resolve, reject) => {

            Promise.all([
                this.getFiles()
            ]).then(
                ([x]) => {
                    resolve(x);
                },
                reject
            );
        });
    } */

    /**
     * Get files
     *
     * @returns {Promise<any>}
     
    getFiles(): Promise<any>
    {
        return new Promise((resolve, reject) => {
            this._httpClient.get('api/file-manager')
                .subscribe((response: any) => {
                    this.onFilesChanged.next(response);
                    this.onFileSelected.next(response[0]);
                    resolve(response);
                }, reject);
        });
    }
    */

    getFiles(): void {
        this.onFilesChanged.next(this.files);
        if(this.files && this.files.length > 0) {
            this.onFileSelected.next(this.files[0]);
        }
        else {
            this.onFileSelected.next(null);
            if(this.autoOpenFileAddIfEmpty){
                this.addFile();        
            }
        }
    }

    addFile(): void {
        this.onFileAdd.next(null);
    }

    download(selected: any): void {
        this.onFileDownload.next(selected);
    }

    delete(selected: any): void {
        this.onFileDelete.next(selected);
    }

    getFileSize(size: string): string {

        let fileSize = size;

        if (fileSize == null) {
            return '0';
        }

        let numSize = parseInt(size);
        if (numSize >= 1024 && numSize < 1024 * 1024) {
            numSize = numSize / 1024;
            fileSize = numSize.toFixed(2) + ' KB';
        } else if (numSize >= 1024 * 1024) {
            numSize = numSize / (1024 * 1024);
            fileSize = numSize.toFixed(2) + ' MB';
        }

        return fileSize;

    }

    requestReload(entryName) {
        this.reloadNeeded.emit(entryName);
    }

    async uploadFile(file: any, data: any, fileParams: any, callPostSaveEvents: boolean = true) {
        let _this = this;
        let isSaving = false;
        
        const loadingToastId = _this._toastService.showLoadingToast("Saving", "Please wait...");
        try {
            // get the S3 URL 
            let responseURL: any = await _this.backendService.createFileURL(data.entryName, _this.authService.getCurrentCompany(data.keys), _this.authService.getLastLanguage(), data.keys).toPromise();
            _this._console.log(responseURL);
            if (responseURL != null && responseURL.result === 'OK') {
                const blob = new Blob([file]);
                // upload the file using obtained url
                let responsePut: any = await _this.httpClient.put(responseURL.url, blob).toPromise();
                _this._console.log('File uploaded with filename: ', responseURL.filename);
                // retrieve file content
                const content = await file?.arrayBuffer();
                const hash = sha1(content);
                const md5hash = md5(content);
                // const hash = CryptoJS.SHA1(_this._encryptionService.arrayBufferToWordArray(content)).toString(CryptoJS.enc.Hex);
                // const md5hash = CryptoJS.MD5(_this._encryptionService.arrayBufferToWordArray(content)).toString(CryptoJS.enc.Hex);
                _this._console.log(hash);
                // check that the file has been correctly uploaded and pass file params to the backend
                var mime = require('mime-types');
                
                let responseCheck: any = await _this.backendService.checkFile(data.entryName, _this.authService.getCurrentCompany(data.keys), _this.authService.getLastLanguage(), data.keys, hash, md5hash, responseURL.filename, fileParams).toPromise();
                _this._console.log(responseCheck);
                if (responseCheck.result === 'OK' || responseCheck.reason == 'File already loaded!') {
                    if (_this.authService.getSyncMode() === 'google') {
                        const googleDriveFileCopyParamsResponse: any = await _this.backendService.getGoogleDriveFileCopyParams(_this.authService.getCurrentCompany(data.keys), _this.authService.getLastLanguage(), hash).toPromise();
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
                        _this._toastService.hideLoadingToast(loadingToastId);
                        _this._toastService.showInfoToast("File already loaded");
                    }
                    else {
                        _this._toastService.hideLoadingToast(loadingToastId);
                        _this._toastService.showSuccessToast("File uploaded successfully");
                    }
                    // if (i < _this.files.length - 1) {
                    //     _this.saveFile(i + 1);
                    // }
                    // else {
                    //     if (data.onSave) {
                    //         data.onSave(true);
                    //     }
                    //     isSaving = false;
                    //     _this.fileService.requestReload(data.entryName);
                    // }
                    if(callPostSaveEvents) {
                        _this.requestReload(data.entryName);
                        _this.onSave.emit(data.entryName);
                        if (data.onSave) {
                            data.onSave(true);
                        }
                    }

                }
                else {
                    // Show error snackbar
                    isSaving = false;
                    _this._toastService.hideLoadingToast(loadingToastId);
                    _this._toastService.showErrorToast(responseCheck.reason);
                }
            }
            else {
                // Show error snackbar
                isSaving = false;
                _this._toastService.hideLoadingToast(loadingToastId);
                _this._toastService.showErrorToast(responseURL.reason);
            }
        }
        catch (e) {
            isSaving = false;
            _this._toastService.hideLoadingToast(loadingToastId);
            _this._toastService.showErrorToast(e);
        }

        /*
        let isSaving = false;
        let attach = false;
        if (file != null) {
            isSaving = true;
            const loadingToastId = _this._toastService.showLoadingToast("Saving", "Please wait...");
            try {
                // get the S3 URL 
                const responseURL: any = await _this.backendService.createFileURL(data.entryName, _this.authService.getCurrentCompany(data.keys), data.keys).toPromise();
                _this._console.log(responseURL);

                if (responseURL != null && responseURL.result === 'OK') {
                    const blob = new Blob([file]);
                    // upload the file using obtained url
                    // const responsePut: any = await _this.httpClient.put(responseURL.url, blob).toPromise();
                    _this._console.log('File uploaded with filename: ', responseURL.filename);
                    // retrieve file content
                    const content = await file?.arrayBuffer();
                    const hash = sha1(content);
                    const md5hash = md5(content);
                    // const hash = CryptoJS.SHA1(_this._encryptionService.arrayBufferToWordArray(content)).toString(CryptoJS.enc.Hex);
                    // const md5hash = CryptoJS.MD5(_this._encryptionService.arrayBufferToWordArray(content)).toString(CryptoJS.enc.Hex);
                    _this._console.log(hash);
                    // check that the file has been correctly uploaded and pass file params to the backend
                    
                    const responseCheck: any = await _this.backendService.checkFile(data.entryName, _this.authService.getCurrentCompany(data.keys), data.keys, hash, md5hash, responseURL.filename, fileParams).toPromise();
                    _this._console.log('responseCheck: ', responseCheck);
                    if (responseCheck.result === 'OK' || responseCheck.reason == 'File already loaded!') {
                        _this._console.log(responseCheck);
                        if (_this.authService.getSyncMode() === 'google1') {
                            try {
                                const googleDriveFileCopyParamsResponse: any = await _this.backendService.getGoogleDriveFileCopyParams(_this.authService.getCurrentCompany(data.keys), hash).toPromise();
                                _this._console.log('googleDriveFileCopyParamsResponse', googleDriveFileCopyParamsResponse);
                                if (googleDriveFileCopyParamsResponse.result === 'OK') {
                                    if (googleDriveFileCopyParamsResponse.response && googleDriveFileCopyParamsResponse.response.rows && googleDriveFileCopyParamsResponse.response.rows[0]) {
                                        let auth = await _this.authService.loadGoogleAuth('gdrive');
                                        let googledrivepath = googleDriveFileCopyParamsResponse.response.rows[0].googledrivepath;
                                        let s3path = googleDriveFileCopyParamsResponse.response.rows[0].s3path;
                                        const copyFromS3ToDriveResponse: any = await _this.backendService.copyFromS3ToDrive(s3path, googledrivepath, auth).toPromise();
                                        _this._console.log(googledrivepath, s3path);
                                        _this._console.log('copyFromS3ToDriveResponse', copyFromS3ToDriveResponse);
                                    }
                                }
                            }
                            catch (e) {
                                _this._console.error("Google upload error: ", e);
                            }
                        }
                        else {
                            / * _this._console.error("You are not subscribed to use Google services");
                            _this._dialogService.showErrorDialog("Error", "You are not subscribed to use Google services");     * /
                        }
                        // Show success snackbar
                        isSaving = false;
                        if (responseCheck.reason === 'File already loaded!') {
                            _this._toastService.hideLoadingToast(loadingToastId);
                            _this._toastService.showInfoToast("File already loaded");
                        }
                        else {
                            _this._toastService.hideLoadingToast(loadingToastId);
                            _this._toastService.showSuccessToast("File uploaded successfully");
                        }
                        if(callPostSaveEvents) {
                            _this.requestReload(data.entryName);
                            _this.onSave.emit(data.entryName);
                            if (data.onSave) {
                                data.onSave(true);
                            }
                        }
                    }
                    else {
                        // Show error snackbar
                        isSaving = false;
                        _this._toastService.hideLoadingToast(loadingToastId);
                        _this._toastService.showErrorToast(responseCheck.reason);
                    }
                }
                else {
                    // Show error snackbar
                    isSaving = false;
                    _this._toastService.hideLoadingToast(loadingToastId);
                    _this._toastService.showErrorToast(responseURL.reason);
                }
            }
            catch (e) {
                // Show error snackbar
                isSaving = false;
                _this._toastService.hideLoadingToast(loadingToastId);
                _this._toastService.showErrorToast(e);
            }
        }
        */
    }

    async uploadFiles(filesData: any[]) {
        let i = 0;
        for(const fileData of filesData) {
            i++;
            let {file, data, fileParams} = fileData;
            await this.uploadFile(file, data, fileParams, i === filesData.length);
        }
    }
}
