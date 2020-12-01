import { Injectable, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';
// import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { Observable, BehaviorSubject } from 'rxjs';
import { ToastService } from './toast.service';
import { ActivatedRoute, Router } from '@angular/router';
import { BackendService } from '../views/backend/backend.service';
import { NgxPubSubService } from '@pscoped/ngx-pub-sub';
import { AuthService } from '../login-page/auth.service';
import { DialogService } from './dialog.service';
import { MatDialog } from '@angular/material';
import { ImportDialogComponent } from '../dialogs/import.dialog/import.dialog.component';


export interface ImportItem {
    label: string;
    queryString: string;
}

export interface ImportList {
    entryName: string;
    items: ExportItem[]
};

export interface ExportItem {
    label: string;
    queryString: string;
}

export interface ExportList {
    entryName: string;
    items: ExportItem[]
};

@Injectable({
    providedIn: 'root'
})
export class ImportExportService {

    // local import data
    private _currentImportData: ImportList = {
        entryName: "",
        items: []
    };

    // local export data
    private _currentExportData: ExportList = {
        entryName: "",
        items: []
    };

    // get current data
    public getCurrentExportData() {
        return this._currentExportData;
    }

    // Stream for loaded importlist
    public onImportListLoaded: BehaviorSubject<ImportList>;

    // Event Emitter for import requests
    public onImportRequested: EventEmitter<string> = new EventEmitter();

    // Event Emitter for importing advanced requests
    public onAdvancedImportRequested: EventEmitter<string> = new EventEmitter();


    // Stream for loaded export list
    public onExportListLoaded: BehaviorSubject<ExportList>;

    // Event Emitter for getting csv requests
    public onGetCSVRequested: EventEmitter<string> = new EventEmitter();

    // Event Emitter for getting excel requests
    public onGetExcelRequested: EventEmitter<string> = new EventEmitter();

    // Event Emitter for getting template requests
    public onGetTemplateRequested: EventEmitter<string> = new EventEmitter();


    /**
     * Constructor
     *
     */
    constructor(public _importDialog: MatDialog,
        private _backendService: BackendService,
        private _httpClient: HttpClient,
        private _authService: AuthService,
        private _toastService: ToastService,
        private _dialogService: DialogService
    ) {
        let _this = this;

        // Set the defaults
        _this._currentImportData = {
            entryName: "test",
            items: [
                {
                    label: 'i1',
                    queryString: 'test 1'
                },
                {
                    label: 'i2',
                    queryString: 'test 2'
                },
                {
                    label: 'i3',
                    queryString: 'test 3'
                }
            ]
        };

        _this._currentExportData = {
            entryName: "test", items: [
                {
                    label: 't1',
                    queryString: 'test 1'
                },
                {
                    label: 't2',
                    queryString: 'test 2'
                },
                {
                    label: 't3',
                    queryString: 'test 3'
                }
            ]
        };


        _this.onImportListLoaded = new BehaviorSubject(_this._currentImportData);
        _this.onExportListLoaded = new BehaviorSubject(_this._currentExportData);
    }

    /**
     * Update import list
     * @param tableName table to import into
     * @param data table 
     */
    updateImportList(tableName: string, data: ImportItem[]) {
        this._currentImportData = { entryName: tableName, items: data };
        this.onImportListLoaded.next(this._currentImportData);
    }

    /**
     * Update export list
     * @param tableName table to import into
     * @param data table 
     */
    updateExportList(tableName: string, data: ExportItem[]) {
        this._currentExportData = { entryName: tableName, items: data };
        this.onExportListLoaded.next(this._currentExportData);
    }

    /**
     * Show Import Dialog
     * @param tableName table to import into
     */
    importCSV(tableName: string): void {
        let _this = this;

        // Open dialog
        const dialogRef = this._importDialog.open(ImportDialogComponent, {
            width: '1280px',
            data: { tableName: tableName }
        });

        // Check result to perform import
        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                console.table(result);
                _this.performImport(result.tableName, result.files, null, result.allowMultipleFiles);
            }
        });
    }

    /**
     * Show Import Dialog
     * @param tableName table to import into
     * @param label label of the import item
     */
    importAdvancedCSV(tableName: string, label: string): void {
        let _this = this;

        // Open dialog
        const dialogRef = this._importDialog.open(ImportDialogComponent, {
            width: '1280px',
            data: { tableName: tableName }
        });

        // Check result to perform import
        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                console.table(result);
                _this.performImport(result.tableName, result.files, label, result.allowMultipleFiles);
            }
        });
    }

    downloadCSV(entryName: string, company: string, keys: any, search_keys: any, is_form: boolean, advanced_query_label: string = null) {
        let _this = this;

        // Show loading Dialog
        _this._dialogService.showLoadingDialog("Preparing CSV", "Please wait...");

        _this._backendService.getCSV(entryName, company, keys, search_keys, is_form, advanced_query_label !== null, advanced_query_label)
            .subscribe(
                response => {
                    _this._dialogService.closeDialog();
                    console.log(response);
                    if (response.result === 'OK') {
                        // File is okay.
                        // Let's try to download it using simple window method first
                        let downloadWindow = window.open(response.url, "_blank");

                        // Check if the browser allowed window.open function
                        if (downloadWindow) {
                            // Window opened so must have downloaded
                            // Show success toast
                            _this._toastService.showSuccessToast("", "CSV downloaded successfully!");
                        }
                        else {
                            // Window did not open so let's try the manual download methond
                            // Download the file as blob
                            _this._httpClient.get(response.url, { responseType: 'blob' }).subscribe(
                                fileData => {
                                    // File downloaded
                                    // Get file name
                                    let parts = response.url.split('/');
                                    let fileName = parts[parts.length - 1].split('?')[0];

                                    // Let's save it
                                    saveAs(fileData, fileName);

                                    // Show success toast
                                    _this._toastService.showSuccessToast("", "CSV downloaded successfully!");
                                });
                        }
                    }
                    else {
                        // File did not succeed, show error message
                        _this._toastService.showErrorToast("An error occured!", "An error occured!")
                    }
                }, error => {
                    // Error occured!
                    _this._dialogService.closeDialog();
                    _this._toastService.showErrorToast("An error occured!", error);

                });


    }

    downloadExcel(entryName: string, company: string, keys: any, search_keys: any, is_form: boolean, advanced_query_label: string = null) {
        let _this = this;

        // Show loading Dialog
        _this._dialogService.showLoadingDialog("Preparing Excel sheet", "Please wait...");

        _this._backendService.getExcel(entryName, company, keys, search_keys, is_form, advanced_query_label !== null, advanced_query_label)
            .subscribe(
                response => {
                    _this._dialogService.closeDialog();
                    console.log(response);
                    if (response.result === 'OK') {
                        // File is okay.
                        // Let's try to download it using simple window method first
                        let downloadWindow = window.open(response.url, "_blank");

                        // Check if the browser allowed window.open function
                        if (downloadWindow) {
                            // Window opened so must have downloaded
                            // Show success toast
                            _this._toastService.showSuccessToast("", "Excel sheet downloaded successfully!");
                        }
                        else {
                            // Window did not open so let's try the manual download methond
                            // Download the file as blob
                            _this._httpClient.get(response.url, { responseType: 'blob' }).subscribe(
                                fileData => {
                                    // File downloaded
                                    // Get file name
                                    let parts = response.url.split('/');
                                    let fileName = parts[parts.length - 1].split('?')[0];

                                    // Let's save it
                                    saveAs(fileData, fileName);

                                    // Show success toast
                                    _this._toastService.showSuccessToast("", "Excel sheet downloaded successfully!");
                                });
                        }
                    }
                    else {
                        // File did not succeed, show error message
                        _this._toastService.showErrorToast("An error occured!", "An error occured!")
                    }
                }, error => {
                    // Error occured!
                    _this._dialogService.closeDialog();
                    _this._toastService.showErrorToast("An error occured!", error);

                });


    }

    /**
     * Download Template file
     * @param tableName table to import into
     */
    getTemplateFile(tableName: string) {

        if (tableName) {
            this._dialogService.showLoadingDialog("Downloading Template", "Please wait...");

            this._backendService.downloadTemplate(tableName).subscribe(
                downloadTemplateResponse => {
                    console.log(downloadTemplateResponse);
                    if (downloadTemplateResponse != null && downloadTemplateResponse.result === 'OK') {
                        // Let's save it
                        var blob = new Blob([downloadTemplateResponse.response], { type: "octet/stream" });
                        saveAs(blob, `${tableName}_template.csv`);
                        this._dialogService.closeDialog();
                        this._toastService.showSuccessToast("Template downloaded successfully!");
                        return;
                    }
                    else {
                        this._dialogService.closeDialog();
                        console.error(downloadTemplateResponse.reason);
                        // Show error snackbar
                        this._toastService.showErrorToast(downloadTemplateResponse.reason);
                    }
                }, error => {
                    // Error occured!
                    this._dialogService.closeDialog();
                    this._toastService.showErrorToast("An error occured!", error);

                }
            );
        }



    }

    /**
     * Show Import Dialog
     * @param tableName table to import into
     * @param files files to import, currently only one file supported
     * @param allowMultipleFiles should import single or multiple files
     */
    performImport(tableName: string, files: any[], label: string = null, allowMultipleFiles: boolean): void {

        if (files != null && files.length) {
            this._dialogService.showLoadingDialog("Uploading", "Please wait...");
            // Get the S3 Create URL 
            this._backendService.createImportFileURL().subscribe(
                createURLResponse => {
                    console.log(createURLResponse);
                    if (createURLResponse != null && createURLResponse.result === 'OK') {
                        const blob = new Blob([files[0]]);
                        // Upload the file using obtained url
                        this._httpClient.put(createURLResponse.url, blob).subscribe(
                            responsePut => {
                                console.table(responsePut);
                                this._toastService.showSuccessToast("File uploaded!");
                                this._dialogService.showLoadingDialog("Importing", "Please wait...");

                                // Import CSV in Postgres
                                this._backendService.importFileFromS3(this._authService.getCurrentCompany(), createURLResponse.fileName, tableName, null).subscribe(
                                    importFileFromS3Response => {
                                        console.log(importFileFromS3Response);
                                        if (importFileFromS3Response != null && importFileFromS3Response.result === 'OK') {

                                            this._toastService.showSuccessToast("File imported!");
                                            this._dialogService.showLoadingDialog("Finalizing", "Please wait...");

                                            // Get the S3 Delete URL
                                            this._backendService.deleteImportFileURL(createURLResponse.fileName).subscribe(
                                                deleteURLResponse => {
                                                    console.log(deleteURLResponse);
                                                    if (deleteURLResponse != null && deleteURLResponse.result === 'OK') {
                                                        // Delete file from S3
                                                        this._httpClient.delete(deleteURLResponse.url).subscribe(
                                                            responseDelete => {
                                                                console.table(responseDelete);
                                                                // Success
                                                                this._toastService.showSuccessToast("File imported!");
                                                                this._dialogService.closeDialog();
                                                                this._dialogService.showSuccessDialog("Success", "Data imported successfully!");
                                                            },
                                                            error => {
                                                                console.error(error);
                                                                this._dialogService.closeDialog();
                                                                this._dialogService.showErrorDialog("Error", "Error uploading file!");
                                                            }
                                                        );
                                                    }
                                                    else {
                                                        this._dialogService.closeDialog();
                                                        console.error(createURLResponse.reason);
                                                        // Show error snackbar
                                                        this._toastService.showErrorToast(createURLResponse.reason);
                                                    }
                                                }, error => {
                                                    // Error occured!
                                                    this._dialogService.closeDialog();
                                                    this._toastService.showErrorToast("An error occured!", error);

                                                }
                                            )
                                        }
                                        else {
                                            // Failure
                                            console.error(importFileFromS3Response.reason);
                                            this._toastService.showErrorToast("File import error!");
                                            this._dialogService.showLoadingDialog("Finalizing", "Please wait...");

                                            // Get the S3 Delete URL
                                            this._backendService.deleteImportFileURL(createURLResponse.fileName).subscribe(
                                                deleteURLResponse => {
                                                    console.log(deleteURLResponse);
                                                    if (deleteURLResponse != null && deleteURLResponse.result === 'OK') {
                                                        // Delete file from S3
                                                        this._httpClient.delete(deleteURLResponse.url).subscribe(
                                                            responseDelete => {
                                                                console.table(responseDelete);
                                                                // Show error
                                                                this._dialogService.closeDialog();
                                                                this._dialogService.showErrorDialog("Error", importFileFromS3Response.reason);
                                                            },
                                                            error => {
                                                                console.error(error);
                                                                this._dialogService.closeDialog();
                                                                this._dialogService.showErrorDialog("Error", "Error deleting file!");
                                                            }
                                                        );
                                                    }
                                                    else {
                                                        this._dialogService.closeDialog();
                                                        console.error(createURLResponse.reason);
                                                        // Show error snackbar
                                                        this._toastService.showErrorToast(createURLResponse.reason);
                                                    }
                                                }, error => {
                                                    // Error occured!
                                                    this._dialogService.closeDialog();
                                                    this._toastService.showErrorToast("An error occured!", error);

                                                }
                                            )
                                        }
                                    }, error => {
                                        // Error occured!
                                        this._dialogService.closeDialog();
                                        this._toastService.showErrorToast("An error occured!", error);

                                    }
                                )
                            },
                            error => {
                                console.error(error);
                                this._dialogService.closeDialog();
                                this._dialogService.showErrorDialog("Error", "Error uploading file!");
                            }
                        );
                    }
                    else {
                        this._dialogService.closeDialog();
                        console.error(createURLResponse.reason);
                        // Show error snackbar
                        this._toastService.showErrorToast(createURLResponse.reason);
                    }
                }, error => {
                    // Error occured!
                    this._dialogService.closeDialog();
                    this._toastService.showErrorToast("An error occured!", error);

                }
            )
        }
    }

    requestImport(entryName = "") {
        this.onImportRequested.emit(entryName);
    }

    requestAdvancedImport(label: string) {
        // if label is null, this must be normal CSV
        if (label === null) {
            this.onImportRequested.emit("");
        }
        else {
            // label is not null, request if item with label exists in current list
            if (this._currentImportData.items.filter(x => x.label === label).length > 0) {
                this.onAdvancedImportRequested.emit(label);
            }
        }
    }

    requestGetCSV(label: string) {
        // if label is null, this must be normal CSV
        if (label === null) {
            this.onGetCSVRequested.emit(null);
        }
        else {
            // label is not null, request if item with label exists in current list
            if (this._currentExportData.items.filter(x => x.label === label).length > 0) {
                this.onGetCSVRequested.emit(label);
            }
        }
    }

    requestGetExcel(label) {
        // if label is null, this must be normal Excel
        if (label === null) {
            this.onGetExcelRequested.emit(null);
        }
        else {
            // label is not null, request if item with label exists in current list
            if (this._currentExportData.items.filter(x => x.label === label).length > 0) {
                this.onGetExcelRequested.emit(label);
            }
        }
    }

    requestGetTemplate(entryName = "") {
        this.onGetTemplateRequested.emit(entryName);
    }

}

