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
    alias: string;
    descrizione: string;
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

    // Event Emitter for reload requests
    public reloadRequested: EventEmitter<string> = new EventEmitter();

    // Event Emitter for getting report requests
    public getExportItemRequested: EventEmitter<string> = new EventEmitter();

    // Event Emitter for import requests
    public importRequested: EventEmitter<string> = new EventEmitter();

    // Event Emitter for getting template requests
    public getTemplateRequested: EventEmitter<string> = new EventEmitter();


    /**
     * Constructor
     *
     */
    constructor(public importDialog: MatDialog,
        private backendService: BackendService,
        private httpClient: HttpClient,
        private authService: AuthService,
        private _toastService: ToastService,
        private _dialogService: DialogService
    ) {

        // Set the defaults
        this.onExportListLoaded = new BehaviorSubject({ entryName: "", items: [] });

    }

    /**
     * Show Import Dialog
     * @param tableName table to import into
     */
    importCSV(tableName: string): void {
        let _this = this;

        // Open dialog
        const dialogRef = this.importDialog.open(ImportDialogComponent, {
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

    /**
     * Download Template file
     * @param tableName table to import into
     */
    getTemplateFile(tableName: string) {

        if (tableName) {
            this._dialogService.showLoadingDialog("Downloading Template", "Please wait...");

            this.backendService.downloadTemplate(tableName).subscribe(
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
            this.backendService.createImportFileURL().subscribe(
                createURLResponse => {
                    console.log(createURLResponse);
                    if (createURLResponse != null && createURLResponse.result === 'OK') {
                        const blob = new Blob([files[0]]);
                        // Upload the file using obtained url
                        this.httpClient.put(createURLResponse.url, blob).subscribe(
                            responsePut => {
                                console.table(responsePut);
                                this._toastService.showSuccessToast("File uploaded!");
                                this._dialogService.showLoadingDialog("Importing", "Please wait...");

                                // Import CSV in Postgres
                                this.backendService.importFileFromS3(this.authService.getCurrentCompany(), createURLResponse.fileName, tableName, null).subscribe(
                                    importFileFromS3Response => {
                                        console.log(importFileFromS3Response);
                                        if (importFileFromS3Response != null && importFileFromS3Response.result === 'OK') {

                                            this._toastService.showSuccessToast("File imported!");
                                            this._dialogService.showLoadingDialog("Finalizing", "Please wait...");

                                            // Get the S3 Delete URL
                                            this.backendService.deleteImportFileURL(createURLResponse.fileName).subscribe(
                                                deleteURLResponse => {
                                                    console.log(deleteURLResponse);
                                                    if (deleteURLResponse != null && deleteURLResponse.result === 'OK') {
                                                        // Delete file from S3
                                                        this.httpClient.delete(deleteURLResponse.url).subscribe(
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
                                            this.backendService.deleteImportFileURL(createURLResponse.fileName).subscribe(
                                                deleteURLResponse => {
                                                    console.log(deleteURLResponse);
                                                    if (deleteURLResponse != null && deleteURLResponse.result === 'OK') {
                                                        // Delete file from S3
                                                        this.httpClient.delete(deleteURLResponse.url).subscribe(
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

    requestReload(entryName) {
        // Request only if we already don't have the reports for this entryName
        if (this._currentData.entryName !== entryName) {
            this.reloadRequested.emit(entryName);
        }
    }

    requestGetExportItem(alias) {
        // Request if report with alias exists in current reports list
        if (this._currentData.items.filter(x => x.alias === alias).length > 0) {
            this.getExportItemRequested.emit(alias);
        }
    }

    requestImport(entryName = "") {
        this.importRequested.emit(entryName);
    }

    requestGetTemplate(entryName = "") {
        this.getTemplateRequested.emit(entryName);
    }

}

