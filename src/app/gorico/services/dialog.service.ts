import { Injectable } from '@angular/core';
import Swal, { SweetAlertResult, SweetAlertIcon, SweetAlertOptions, SweetAlertPosition } from 'sweetalert2'


@Injectable({
    providedIn: 'root'
})
export class DialogService {

    // Examples:
    // this.DialogService.setDialogTheme('top-end', 240);
    // this.DialogService.showDialog('Yesh! Done.', 2500);
    // this.DialogService.showSuccessDialog('Yesh! Done.', 2500);
    // this.DialogService.showErrorDialog('Yesh! Done.', 2500);

    // this.DialogService.showErrorDialog('Oops...', 'Something went wrong!');
    // this.DialogService.showCustomDialog({
    //     title: 'Are you sure?',
    //     text: 'You will not be able to recover this imaginary file!',
    //     icon: 'info', //'warning',
    //     showCancelButton: true,
    //     confirmButtonText: 'Yes, delete it!',
    //     cancelButtonText: 'No, keep it'
    // }).then((result) => {
    //     if (result.value) {
    //         this.DialogService.showSuccessDialog('Deleted!',
    //             'Your imaginary file has been deleted.');
    //         // For more information about handling dismissals please visit
    //         // https://sweetalert2.github.io/#handling-dismissals
    //     } else if (result.dismiss === Swal.DismissReason.cancel) {
    //         this.DialogService.showErrorDialog('Cancelled',
    //             'Your imaginary file is safe :)',
    //         );
    //     }
    // })

    /**
     * Constructor
     *
     */
    constructor(
    ) {
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
            timer: 2000,
            // icon: 
            onOpen: () => {
                Swal.showLoading();
            }
        });
    }

    //----------------------------- Dialogs -----------------------------------

    /**
     * Show Icon Dialog Dialog
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
     * Show Info Dialog Dialog
     *
     * @param title
     * @param text
     */
    showInfoDialog(title, text): void {
        // Swal.fire('Hello world!');
        this.showIconDialog(title, text, 'info');

    }

    /**
     * Show Success Dialog Dialog
     *
     * @param title
     * @param text
     */
    showSuccessDialog(title, text): void {
        // Swal.fire('Hello world!');
        this.showIconDialog(title, text, 'success');

    }

    /**
     * Show Error Dialog Dialog
     *
     * @param title
     * @param text
     */
    showErrorDialog(title, text): void {
        // Swal.fire('Hello world!');
        this.showIconDialog(title, text, 'error');

    }

    /**
     * Show Question Dialog Dialog
     *
     * @param title
     * @param text
     */
    showQuestionDialog(title, text): void {
        // Swal.fire('Hello world!');
        this.showIconDialog(title, text, 'question');

    }

    /**
     * Show Custom Dialog Dialog
     *
     * @param options
     * @returns Promise<SweetAlertResult>
     */
    showCustomDialog(options: object): Promise<SweetAlertResult> {
        return Swal.fire(options);
    }


}

