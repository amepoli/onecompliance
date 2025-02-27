import { Injectable } from '@angular/core';
import Swal, { SweetAlertResult, SweetAlertIcon, SweetAlertOptions, SweetAlertPosition } from 'sweetalert2'
import { BackendService } from './backend.service';
import { AuthService } from './auth.service';


@Injectable({
    providedIn: 'root'
})
export class CalendarService {

    
    /**
     * Constructor
     *
     */
    constructor(
        private _backendService: BackendService,
        private _authService: AuthService
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

    //----------------------------- Events -----------------------------------

    getCalendarEvents(company: string) {
        return this._backendService.getCalendarEvents(company, this._authService.getLastLanguage());
    }

    //----------------------------- Dialogs -----------------------------------

}

