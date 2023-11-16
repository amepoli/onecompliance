import { Injectable } from '@angular/core';
import Swal, { SweetAlertResult, SweetAlertIcon, SweetAlertOptions, SweetAlertPosition } from 'sweetalert2'
import { MainToolbarDialog } from '../interfaces/main_toolbar_dialog.interface';
import { BehaviorSubject } from 'rxjs';


@Injectable({
    providedIn: 'root'
})
export class DialogService {
    public onMainToolbarDialogLoaded: BehaviorSubject<MainToolbarDialog[]>;
    public onShowMainToolbarDialog: BehaviorSubject<string>;

    // Examples:
    // this.DialogService.setDialogTheme('top-end', 240);
    // this.DialogService.showDialog('Yesh! Done.', 2500);
    // this.DialogService.showSuccessDialog('Yesh! Done.', 2500);
    // this.DialogService.showErrorDialog('Yesh! Done.', 2500);

    // this.DialogService.showErrorDialog('Oops...', 'Something went wrong!');

    // Confimation Dialog Example:
    // this._dialogService.showConfimationDialog("Delete file", "Are you sure you wanna delete file?", "Yes, do it", "No, I changed my mind", "info").then((result) => {
    //     if (result.value === true) {
    //         this._dialogService.showSuccessDialog('Deleted!',
    //             'Your imaginary file has been deleted.');
    //     }
    //     else {
    //         this._dialogService.showErrorDialog('Cancelled',
    //             'Your imaginary file is safe :)',
    //         );
    //     }
    // });

    /**
     * Constructor
     *
     */
    constructor(
    ) {
        const _this = this;
        _this.onMainToolbarDialogLoaded = new BehaviorSubject([]);
        _this.onShowMainToolbarDialog = new BehaviorSubject(null);

    }


    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    //----------------------------- Generic Dialogs -----------------------------------

    /**
     * Close Dialog
     *
     */
    closeDialog(): void {
        Swal.close();
    }

       /**
     * Update main toolbar dialog
    * @param dialogs  
     */
       updateMainToolbarDialogs(dialogs: any) {
        const _this = this;
        _this.onMainToolbarDialogLoaded.next(dialogs);
        }

          /**
     * Show main toolbar dialog
    * @param outputEventName  
     */
       showMainToolbarDialog(outputEventName: string) {
        const _this = this;
        _this.onShowMainToolbarDialog.next(outputEventName);
        }

    //----------------------------- Loading Dialogs -----------------------------------

    /**
     * Show Loading Dialog
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
            timer: 30000,
            // icon: 
            didOpen: () => {
                Swal.showLoading();
            }
        });
    }

    //----------------------------- Dialogs -----------------------------------

    /**
     * Show Icon Dialog
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
     * Show Info Dialog
     *
     * @param title
     * @param text
     */
    showInfoDialog(title, text): void {
        // Swal.fire('Hello world!');
        this.showIconDialog(title, text, 'info');

    }

    /**
     * Show Success Dialog
     *
     * @param title
     * @param text
     */
    showSuccessDialog(title, text): void {
        // Swal.fire('Hello world!');
        this.showIconDialog(title, text, 'success');

    }

    /**
     * Show Error Dialog
     *
     * @param title
     * @param text
     */
    showErrorDialog(title, text): void {
        // Swal.fire('Hello world!');
        this.showIconDialog(title, text, 'error');

    }

    /**
     * Show Question Dialog
     *
     * @param title
     * @param text
     */
    showQuestionDialog(title, text): void {
        // Swal.fire('Hello world!');
        this.showIconDialog(title, text, 'question');

    }

    /**
     * Show Custom Dialog
     *
     * @param options
     * @returns Promise<SweetAlertResult>
     */
    showCustomDialog(options: object): Promise<SweetAlertResult> {
        return Swal.fire(options);
    }

    /**
     * Show Confirmation Dialog
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

