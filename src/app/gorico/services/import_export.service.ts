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

    // local data
    private _currentData: ExportList = {
        entryName: "",
        items: []
    };

    // get current data
    public getCurrentData() {
        return this._currentData;
    }

    // Stream for loaded reports
    public onExportListLoaded: BehaviorSubject<ExportList>;

    // Event Emitter for getting report requests
    public onGetCSVRequested: EventEmitter<string> = new EventEmitter();

    // Event Emitter for import requests
    public onImportRequested: EventEmitter<string> = new EventEmitter();

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

        // Set the defaults
        this.onExportListLoaded = new BehaviorSubject(
            {
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
            }
        );
    }

    /**
     * Update export list
     * @param tableName table to import into
     * @param data table 
     */
    updateExportList(tableName: string, data: ExportItem[]) {
        this._currentData = { entryName: tableName, items: data };
        this.onExportListLoaded.next(this._currentData);
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
                _this.performImport(result.tableName, result.files, result.allowMultipleFiles);
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
    performImport(tableName: string, files: any[], allowMultipleFiles: boolean): void {

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
                                                }
                                            )
                                        }
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
                }
            )
        }
    }

    requestGetCSV(label) {
        // if label is null, this must be normal CSV
        if (label === null) {
            this.onGetCSVRequested.emit(null);
        }
        else {
            // label is not null, request if report with label exists in current reports list
            if (this._currentData.items.filter(x => x.label === label).length > 0) {
                this.onGetCSVRequested.emit(label);
            }
        }
    }

    requestImport(entryName = "") {
        this.onImportRequested.emit(entryName);
    }

    requestGetTemplate(entryName = "") {
        this.onGetTemplateRequested.emit(entryName);
    }

}

