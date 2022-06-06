import { Injectable } from '@angular/core';
import { ToastrService, IndividualConfig, ActiveToast } from 'ngx-toastr';

@Injectable({
    providedIn: 'root'
})
export class ToastService {

    // Examples:
    // this.ToastService.showSuccessToast('Success', 'Yesh! Done.', 2500);
    // this.ToastService.showErrorToast('Error', 'Yesh! Done.', 2500);

    // Private
    private lastLoadingToast: ActiveToast<any> = null;

    private _toastrTheme: Partial<IndividualConfig> = {
        tapToDismiss: true,
        closeButton: false,
        timeOut: 2000,
        extendedTimeOut: 2000,
        easing: 'ease-in',
        easeTime: 300,
        enableHtml: false,
        progressBar: false,
        progressAnimation: 'decreasing',
        toastClass: 'ngx-toastr',
        positionClass: 'toast-top-right',
        titleClass: 'toast-title',
        messageClass: 'toast-message',
        onActivateTick: false
    };

    /**
     * Constructor
     *
     */
    constructor(private toastr: ToastrService) {
    }


    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Set Snackbar Toast Theme
     *
     * @param position
     * @param width
     * @param background
     * @param padding
     * @param showConfirmButton
     * @param toast
     */
    setToastTheme(
        tapToDismiss: true,
        closeButton: false,
        timeOut: 2000,
        extendedTimeOut: 2000,
        easing: 'ease-in',
        easeTime: 300,
        enableHtml: false,
        progressBar: false,
        progressAnimation: 'decreasing',
        toastClass: 'ngx-toastr',
        positionClass: 'toast-top-right',
        titleClass: 'toast-title',
        messageClass: 'toast-message',
        onActivateTick: false): void {

        this._toastrTheme = {
            tapToDismiss: tapToDismiss,
            closeButton: closeButton,
            timeOut: timeOut,
            extendedTimeOut: extendedTimeOut,
            easing: easing,
            easeTime: easeTime,
            enableHtml: enableHtml,
            progressBar: progressBar,
            progressAnimation: progressAnimation,
            toastClass: toastClass,
            positionClass: positionClass,
            titleClass: titleClass,
            messageClass: messageClass,
            onActivateTick: onActivateTick,
        }
    }


    //----------------------------- Toasts -----------------------------------

    /**
     * Show Success Snackbar Toast
     *
     * @param title
     * @param text
     * @param timeOut
     * @param tapToDismiss
     */
    showSuccessToast(title: string, text: string = "", timeOut: number = this._toastrTheme.timeOut, tapToDismiss: boolean = this._toastrTheme.tapToDismiss) {
        this.toastr.success(
            text,
            title,
            {
                timeOut: timeOut,
                tapToDismiss: tapToDismiss
            }
        );
    }

    /**
     * Show Success Snackbar Toast
     *
     * @param title
     * @param text
     * @param timeOut
     * @param tapToDismiss
     */
     showInfoToast(title: string, text: string = "", timeOut: number = this._toastrTheme.timeOut, tapToDismiss: boolean = this._toastrTheme.tapToDismiss) {
        this.toastr.info(
            text,
            title,
            {
                timeOut: timeOut,
                tapToDismiss: tapToDismiss
            }
        );
    }

    /**
     * Show Error Snackbar Toast
     *
     * @param title
     * @param text
     * @param timeOut
     * @param tapToDismiss
     */
    showErrorToast(title: string, text: string = "", timeOut: number = this._toastrTheme.timeOut, tapToDismiss: boolean = this._toastrTheme.tapToDismiss) {
        this.toastr.error(
            "An error occured!",
            "",
            {
                timeOut: timeOut,
                tapToDismiss: tapToDismiss
            }
        );
    }

    /**
     * Show Loading Snackbar Toast
     *
     * @param title
     * @param text
     * @returns toastId
     */
     showLoadingToast(title: string, text) {
        if(this.lastLoadingToast) {
            this.hideLoadingToast(this.lastLoadingToast);
        }

        this.lastLoadingToast = this.toastr.info(
            text,
            title,
            {
                progressBar: true,
                progressAnimation: 'increasing',
                timeOut: 5 * 60 * 1000,
                tapToDismiss: false
            }
        );

        return this.lastLoadingToast;
    }

    /**
     * Hide Loading Snackbar Toast
     *
     * @param toast
     */
     hideLoadingToast(toast: ActiveToast<any>) {
        if (this.lastLoadingToast == toast) {
            this.toastr.remove(this.lastLoadingToast.toastId);
            this.lastLoadingToast = null;
        }
        else {
            this.toastr.remove(toast.toastId);
        }
    }

    


}

