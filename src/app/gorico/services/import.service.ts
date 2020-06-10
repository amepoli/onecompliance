import { Injectable } from '@angular/core';
import Swal, { SweetAlertResult, SweetAlertIcon, SweetAlertOptions, SweetAlertPosition } from 'sweetalert2'
import { MatDialog } from '@angular/material';
import { ImportDialogComponent } from '../dialogs/import.dialog/import.dialog.component';
import { BackendService } from '../views/backend/backend.service';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../login-page/auth.service';
import { ToastService } from './toast.service';
import { DialogService } from './dialog.service';

@Injectable({
    providedIn: 'root'
})
export class ImportService {

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
    }

    /**
     * Show Import Dialog
     * @param tableName table to import into
     */
    showDialog(tableName: string): void {
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
    downloadTemplateFile(tableName: string) {

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
}

