import { EventEmitter, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { FieldConfig } from '../dynamic-forms/field.interface';
import { AuthService } from '../login-page/auth.service';
import { BackendService } from '../views/backend/backend.service';
import { HelperService } from './helper.service';
import { ToastService } from './toast.service';

interface TimeTrackerStatus {
    data: any;
    elapsedTime: string;
}

@Injectable({
    providedIn: 'root'
})
export class TimeTrackerService {

    // Event Emitter for naviate requests
    public navigateRequested: EventEmitter<any> = new EventEmitter();

    
    // Event Emitter for naviate requests
    public statusUpdated: EventEmitter<TimeTrackerStatus> = new EventEmitter();

    /**
     * Constructor
     * @param AuthService
     * @param BackendService
     * @param ToastService
     */
    constructor(
        private _authService: AuthService,
        private _backendService: BackendService,
        private _toastService: ToastService
    ) {
    }


    /**
     * Check Timer Status
     */
    checkTimerStatus() {
        let _this = this;
        const company = _this._authService.getCurrentCompany();
        
        if(company) {
            _this._backendService.checkTimerStatus(company).subscribe(
                result => {
                    if (result.result === 'OK' && result.data) {
                        let status: TimeTrackerStatus = {data: null, elapsedTime: null};
                        if (Array.isArray(result.data)) {
                            status.data = result.data[0];
                        }
                        else {
                            status.data = result.data;
                        }
                        status.elapsedTime = HelperService.getTwoDigitText(status.data.elapsed_time.hours? status.data.elapsed_time.hours: 0) + ':' +
                        HelperService.getTwoDigitText(status.data.elapsed_time.minutes? status.data.elapsed_time.minutes: 0) + ':' +
                        HelperService.getTwoDigitText(status.data.elapsed_time.seconds? status.data.elapsed_time.seconds: 0)
                        _this.statusUpdated.emit(status);
                    }
                    else{
                        _this.statusUpdated.emit(null);
                    }
                },
                error => {
                    _this._toastService.showErrorToast(error);
                    _this.statusUpdated.emit(null);
                }
            );
        }
    }

    /**
     * Start Timer
     * @param data
     */
    startTimer(data: any) {
        let _this = this;
        if(data) {
            _this._backendService.startTimer(data.codice_azienda, data.codice_compito).subscribe(
                result => {
                    let status = false;
                    if (result.result === 'OK' && result.data) {
                        if (Array.isArray(result.data)) {
                            status = result.data[0].time_report_play;
                        }
                        else {
                            status = result.data.time_report_play;
                        }
                    }
                    else {
                        status = false;
                    }
                    if (status) {
                        _this._toastService.showSuccessToast('Task started!');
                    }
                    else {
                        _this._toastService.showErrorToast('Task startng failed!');
                    }
                },
                error => {
                    _this._toastService.showErrorToast(error);
                }
            );
        }
    }

    /**
     * Stop Timer
     * @param data
     */
    stopTimer(data: any) {
        let _this = this;
        if(data) {
            _this._backendService.stopTimer(data.codice_azienda).subscribe(
                result => {
                    let status = false;
                    if (result.result === 'OK' && result.data) {
                        if (Array.isArray(result.data)) {
                            status = result.data[0].time_report_stop;
                        }
                        else {
                            status = result.data.time_report_stop;
                        }
                    }
                    else {
                        status = false;
                    }
                    if (status) {
                        _this._toastService.showSuccessToast('Task stopped!');
                    }
                    else {
                        _this._toastService.showErrorToast('Task stopping failed!');
                    }
                },
                error => {
                    _this._toastService.showErrorToast(error);
                    
                }
            );
        }
    }

    /**
     * Request Navigate
     * @param data
     */
    requestNavigate(data: any) {
        let params = {
            entry:{name: 'compiti_consultant_micro_task', type: 'form'},
            index: 1,
            keys: [
                {codice_azienda: data.codice_azienda, codice_compito: data.codice_compito}
            ]
        };
        
        this.navigateRequested.emit({ eventType: "navigate", queryParams: params });
    }

}

