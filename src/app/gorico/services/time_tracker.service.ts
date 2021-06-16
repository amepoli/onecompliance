import { EventEmitter, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { TimeTrackerStatus } from '../interfaces';
import { AuthService } from './auth.service';
import { BackendService } from './backend.service';
import { HelperService } from './helper.service';
import { ToastService } from './toast.service';

@Injectable({
    providedIn: 'root'
})
export class TimeTrackerService {

    // Event Emitter for naviate requests
    public navigateRequested: EventEmitter<any> = new EventEmitter();

    
    // Event Emitter for naviate requests
    public statusUpdated: EventEmitter<TimeTrackerStatus> = new EventEmitter();

    public currentElapsedTime: {
        hours: number,
        minutes: number,
        seconds: number,
        milliseconds: number
    };

    public lastStatus: TimeTrackerStatus;
    public lastStatusUpdate: Date;
    public nextTry: number = 0;

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
    checkTimerStatus(forced = false) {
        let _this = this;
        const company = _this._authService.getCurrentCompany();
        
        if(forced || !_this.lastStatus || !_this.lastStatusUpdate || (Date.now() - _this.nextTry) > 10000) {
            if(company) {
                if(_this.lastStatus) {
                    _this.updateStatusLocally();
                }
                let subscription = _this._backendService.checkTimerStatus(company).subscribe(
                    result => {
                        _this.nextTry = Date.now() + 10000;
                        if (result.result === 'OK' && result.data) {
                            let status: TimeTrackerStatus = {data: null, elapsedTime: null};
                            if (Array.isArray(result.data)) {
                                status.data = result.data[0];
                            }
                            else {
                                status.data = result.data;
                            }
                            
                            if(!_this.lastStatus || _this.isStatusDifferent(_this.lastStatus, status)) {
                                status.elapsedTime = HelperService.getTwoDigitText(status.data.elapsed_time.hours? status.data.elapsed_time.hours: 0) + ':' +
                                HelperService.getTwoDigitText(status.data.elapsed_time.minutes? status.data.elapsed_time.minutes: 0) + ':' +
                                HelperService.getTwoDigitText(status.data.elapsed_time.seconds? status.data.elapsed_time.seconds: 0)
                                
                                _this.lastStatusUpdate = new Date();
                                _this.lastStatus = status;
                                _this.lastStatus.data.elapsed_time.hours = _this.lastStatus.data.elapsed_time.hours || 0;
                                _this.lastStatus.data.elapsed_time.minutes = _this.lastStatus.data.elapsed_time.minutes || 0;
                                _this.lastStatus.data.elapsed_time.seconds = _this.lastStatus.data.elapsed_time.seconds || 0;
                                _this.lastStatus.data.elapsed_time.milliseconds = _this.lastStatus.data.elapsed_time.milliseconds || 0;
                                
                                _this.statusUpdated.emit(status);

                            }
                            else {
                                _this.updateStatusLocally();
                            }
                        }
                        else{
                            _this.statusUpdated.emit(null);
                        }
                        subscription.unsubscribe();
                    },
                    error => {
                        _this._toastService.showErrorToast(error);
                        _this.statusUpdated.emit(null);
                        _this.nextTry = Date.now() + 10000;
                        subscription.unsubscribe();
                    }
                );
            }
        }
        else {
            _this.updateStatusLocally();
        }

        
    }

    /**
     * Start Timer
     * @param data
     */
    startTimer(data: any) {
        let _this = this;
        if(data) {
            let subscription = _this._backendService.startTimer(data.codice_azienda, data.codice_compito).subscribe(
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
                        _this.checkTimerStatus(true);
                    }
                    else {
                        _this._toastService.showErrorToast('Task startng failed!');
                    }
                    subscription.unsubscribe();
                },
                error => {
                    // _this._toastService.showErrorToast(error);
                    subscription.unsubscribe();
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
            let subscription = _this._backendService.stopTimer(data.codice_azienda).subscribe(
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
                        _this.checkTimerStatus(true);
                    }
                    else {
                        _this._toastService.showErrorToast('Task stopping failed!');
                    }
                    subscription.unsubscribe();
                },
                error => {
                    // _this._toastService.showErrorToast(error);
                    
                    subscription.unsubscribe();
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

    updateStatusLocally() {
        let _this = this;
        if(_this.lastStatus.data.status === 'running') {
            const elapsedMilliseconds: number = Date.now() - _this.lastStatusUpdate.getTime();
            let seconds = 0;
            
            if(elapsedMilliseconds > 999) {
                seconds = parseInt("" + elapsedMilliseconds / 1000);
            }

            let currentStatus = JSON.parse(JSON.stringify(_this.lastStatus));
            currentStatus.data.elapsed_time.seconds += seconds;
            
            if(currentStatus.data.elapsed_time.seconds > 59) {
                currentStatus.data.elapsed_time.minutes = currentStatus.data.elapsed_time.minutes + parseInt("" + (currentStatus.data.elapsed_time.seconds / 60));
                currentStatus.data.elapsed_time.seconds = currentStatus.data.elapsed_time.seconds % 60;
            }
            
            if(currentStatus.data.elapsed_time.minutes > 59) {
                currentStatus.data.elapsed_time.hours = currentStatus.data.elapsed_time.hours + parseInt("" + (currentStatus.data.elapsed_time.minutes / 60));
                currentStatus.data.elapsed_time.minutes = currentStatus.data.elapsed_time.minutes % 60;
            }
            
            currentStatus.elapsedTime = HelperService.getTwoDigitText(currentStatus.data.elapsed_time.hours? currentStatus.data.elapsed_time.hours: 0) + ':' +
                            HelperService.getTwoDigitText(currentStatus.data.elapsed_time.minutes? currentStatus.data.elapsed_time.minutes: 0) + ':' +
                            HelperService.getTwoDigitText(currentStatus.data.elapsed_time.seconds? currentStatus.data.elapsed_time.seconds: 0)
            _this.statusUpdated.emit(currentStatus);
        }

    }

    isStatusDifferent(oldStatus: any, newStatus: any) {
        if(
            oldStatus.data.codice_azienda !== newStatus.data.codice_azienda ||
            oldStatus.data.codice_compito !== newStatus.data.codice_compito ||
            oldStatus.data.date_time_begin !== newStatus.data.date_time_begin ||
            oldStatus.data.description !== newStatus.data.description ||
            oldStatus.data.status !== newStatus.data.status            
        ) {
            return true;
        }
        return false;
    }
}

