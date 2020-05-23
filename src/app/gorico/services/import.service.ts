import { Injectable } from '@angular/core';
import Swal, { SweetAlertResult, SweetAlertIcon, SweetAlertOptions, SweetAlertPosition } from 'sweetalert2'
import { MatDialog } from '@angular/material';
import { ImportDialogComponent } from '../dialogs/import.dialog/import.dialog.component';


@Injectable({
    providedIn: 'root'
})
export class ImportService {

    /**
     * Constructor
     *
     */
    constructor(public importDialog: MatDialog) {
    }


    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------


    //----------------------------- Generic Dialogs -----------------------------------

    /**
     * Show Import Dialog
     *
     */
    showDialog(): void {
        // Pop-up example
        const dialogRef = this.importDialog.open(ImportDialogComponent, {
            width: '1280px',
            data: { entryName: "Import", keys: null }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                console.table(result);
            }
        });
    }

    //----------------------------- Loading Dialogs -----------------------------------

    /**
     * Show Loading Import
     *
     * @param title
     * @param text
     */
    showLoadingDialog(title, text): void {
        Swal.fire({
            title: title,
            text: text,
            allowEscapeKey: false,
            allowOutsideClick: false,
            timer: 2000,
            // icon: 
            onOpen: () => {
                Swal.showLoading();
            }
        });
    }

    //----------------------------- Dialogs -----------------------------------

    /**
     * Show Icon Import
     *
     * @param title
     * @param text
     * @param icon
     */
    showIconDialog(title, text, icon): void {
        // Swal.fire('Hello world!');
        Swal.fire(title, text, icon);
    }

    /**
     * Show Info Import
     *
     * @param title
     * @param text
     */
    showInfoDialog(title, text): void {
        // Swal.fire('Hello world!');
        this.showIconDialog(title, text, 'info');

    }

    /**
     * Show Success Import
     *
     * @param title
     * @param text
     */
    showSuccessDialog(title, text): void {
        // Swal.fire('Hello world!');
        this.showIconDialog(title, text, 'success');

    }

    /**
     * Show Error Import
     *
     * @param title
     * @param text
     */
    showErrorDialog(title, text): void {
        // Swal.fire('Hello world!');
        this.showIconDialog(title, text, 'error');

    }

    /**
     * Show Question Import
     *
     * @param title
     * @param text
     */
    showQuestionDialog(title, text): void {
        // Swal.fire('Hello world!');
        this.showIconDialog(title, text, 'question');

    }

    /**
     * Show Custom Import
     *
     * @param options
     * @returns Promise<SweetAlertResult>
     */
    showCustomDialog(options: object): Promise<SweetAlertResult> {
        return Swal.fire(options);
    }

    /**
     * Show Confirmation Import
     *
     * @param title
     * @param text
     * @param yesBtnLabel
     * @param noBtnLabel
     * @param? icon
     * @returns Promise<SweetAlertResult>
     */
    showConfimationDialog(title: string, text: string, yesBtnLabel: string, noBtnLabel: string, icon: SweetAlertIcon = "info"): Promise<SweetAlertResult> {
        let options: SweetAlertOptions = {
            title: title,
            text: text,
            icon: icon, //'info',
            showCancelButton: true,
            confirmButtonText: yesBtnLabel,
            cancelButtonText: noBtnLabel,
        };

        return Swal.fire(options);
    }
}

