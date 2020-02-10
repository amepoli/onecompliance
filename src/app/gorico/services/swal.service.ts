import { Injectable } from '@angular/core';
import Swal, { SweetAlertResult, SweetAlertIcon, SweetAlertOptions, SweetAlertPosition } from 'sweetalert2'


@Injectable({
    providedIn: 'root'
})
export class SwalService {

    // Examples:
    // this.swalService.setSnackbarSwalTheme('top-end', 240);
    // this.swalService.showSnackbarSwal('Yesh! Done.', 2500);
    // this.swalService.showSuccessSnackbarSwal('Yesh! Done.', 2500);
    // this.swalService.showErrorSnackbarSwal('Yesh! Done.', 2500);

    // this.swalService.showErrorDialogSwal('Oops...', 'Something went wrong!');
    // this.swalService.showCustomDialogSwal({
    //     title: 'Are you sure?',
    //     text: 'You will not be able to recover this imaginary file!',
    //     icon: 'info', //'warning',
    //     showCancelButton: true,
    //     confirmButtonText: 'Yes, delete it!',
    //     cancelButtonText: 'No, keep it'
    // }).then((result) => {
    //     if (result.value) {
    //         this.swalService.showSuccessDialogSwal('Deleted!',
    //             'Your imaginary file has been deleted.');
    //         // For more information about handling dismissals please visit
    //         // https://sweetalert2.github.io/#handling-dismissals
    //     } else if (result.dismiss === Swal.DismissReason.cancel) {
    //         this.swalService.showErrorDialogSwal('Cancelled',
    //             'Your imaginary file is safe :)',
    //         );
    //     }
    // })

    // Private
    private _snackTheme: SweetAlertOptions = {
        position: 'top-end',
        width: 240,
        heightAuto: false,
        padding: '0em',
        background: '#fff',
        showConfirmButton: false,
        toast: true,
    };


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

    /**
     * Set Snackbar Swal Theme
     *
     * @param position
     * @param width
     * @param background
     * @param padding
     * @param showConfirmButton
     * @param toast
     */
    setSnackbarSwalTheme(
        position: SweetAlertPosition = 'top-end',
        width: number = 600,
        background: string = '#fff',
        padding: string = '0em',
        showConfirmButton: boolean = false,
        toast: boolean = true): void {

        this._snackTheme = {
            position: position,
            background: background,
            width: width,
            padding: padding,
            showConfirmButton: showConfirmButton,
            toast: toast,
        }
    }

    //----------------------------- Dialog Swals -----------------------------------

    /**
     * Show Icon Dialog Swal
     *
     * @param title
     * @param text
     * @param icon
     */
    showIconDialogSwal(title, text, icon): void {
        // Swal.fire('Hello world!');
        Swal.fire(title, text, icon);
    }

    /**
     * Show Info Dialog Swal
     *
     * @param title
     * @param text
     */
    showInfoDialogSwal(title, text): void {
        // Swal.fire('Hello world!');
        this.showIconDialogSwal(title, text, 'info');

    }

    /**
     * Show Success Dialog Swal
     *
     * @param title
     * @param text
     */
    showSuccessDialogSwal(title, text): void {
        // Swal.fire('Hello world!');
        this.showIconDialogSwal(title, text, 'success');

    }

    /**
     * Show Error Dialog Swal
     *
     * @param title
     * @param text
     */
    showErrorDialogSwal(title, text): void {
        // Swal.fire('Hello world!');
        this.showIconDialogSwal(title, text, 'error');

    }

    /**
     * Show Question Dialog Swal
     *
     * @param title
     * @param text
     */
    showQuestionDialogSwal(title, text): void {
        // Swal.fire('Hello world!');
        this.showIconDialogSwal(title, text, 'question');

    }

    /**
     * Show Custom Dialog Swal
     *
     * @param options
     * @returns Promise<SweetAlertResult>
     */
    showCustomDialogSwal(options: object): Promise<SweetAlertResult> {
        return Swal.fire(options);
    }

    //----------------------------- Snackbar Swals -----------------------------------

    /**
     * Show Snackbar Swal
     *
     * @param text
     * @param time
     * @param background
     */
    showSnackbarSwal(text: string, time: number = 1500, background: string = this._snackTheme.background) {
        Swal.fire({
            position: this._snackTheme.position,
            width: this._snackTheme.width,
            showConfirmButton: this._snackTheme.showConfirmButton,
            toast: this._snackTheme.toast,
            heightAuto: true,
            background: background,
            title: text,
            timer: time
        });
    }

    /**
     * Show Success Snackbar Swal
     *
     * @param text
     * @param icon
     * @param time
     * @param background
     */
    showIconSnackbarSwal(text: string, icon: SweetAlertIcon, time: number = 1500, background: string = this._snackTheme.background) {
        Swal.fire({
            position: this._snackTheme.position,
            width: this._snackTheme.width,
            padding: this._snackTheme.padding,
            showConfirmButton: this._snackTheme.showConfirmButton,
            toast: this._snackTheme.toast,
            heightAuto: true,
            background: background,
            icon: icon,
            title: text,
            timer: time
        });
    }

    /**
     * Show Success Snackbar Swal
     *
     * @param text
     * @param time
     */
    showSuccessSnackbarSwal(text: string, time: number = 1500) {
        this.showIconSnackbarSwal(text, 'success', time, '#3f3');
    }

    /**
     * Show Error Snackbar Swal
     *
     * @param text
     * @param time
     */
    showErrorSnackbarSwal(text: string, time: number = 1500) {
        this.showIconSnackbarSwal(text, 'error', time, '#fff');
    }

}

