import { EventEmitter, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { TimezoneService } from './timezone.service';
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
    public statusUpdated: EventEmitter<TimeTrackerStatus> = new EventEmitter();

    // Event Emitter for description color
    public descriptionColorUpdated: EventEmitter<string> = new EventEmitter();

    public lastStatus: TimeTrackerStatus;
    public lastStatusUpdate: number;
    
    /**
     * Constructor
     * @param AuthService
     * @param BackendService
     * @param ToastService
     */
    constructor(
        private _authService: AuthService,
        private _backendService: BackendService,
        private _toastService: ToastService,
        private _timezoneService: TimezoneService
    ) {
    }

    /**
     * Check Status
     */
    checkStatus() {
        let _this = this;
        const userName = _this._authService.getUsername();
        const dateTimeNow =   HelperService.getFormattedDateTime((new Date()).toString(), _this._timezoneService.timezoneInfo.utc_offset);
        const company = _this._authService.getCurrentCompany();
        
        if(userName && dateTimeNow && company) {
            if(_this.lastStatus) {
                setTimeout(() => {
                    _this.updateStatusLocally();
                }, 1000);
            }
            let isTrDayCompleteSubscription = _this._backendService.isTrDayComplete(userName, dateTimeNow).subscribe(
                isTrDayCompleteResponse => {
                    if(isTrDayCompleteResponse.result === 'OK' && isTrDayCompleteResponse.data && isTrDayCompleteResponse.data[0] && isTrDayCompleteResponse.data[0]['is_tr_day_complete']) {
                        let color = isTrDayCompleteResponse.data[0]['is_tr_day_complete'];
                        _this.descriptionColorUpdated.emit(color);
                        let subscription = _this._backendService.checkTimerStatus(company).subscribe(
                            result => {
                                if (result.result === 'OK' && result.data) {
                                    if(result.data && result.data.length > 0) {
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
                                            
                                            _this.lastStatusUpdate = Date.now();
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
                                subscription.unsubscribe();
                            }
                        );
                    }
                    isTrDayCompleteSubscription.unsubscribe();
                },
                error => {
                    console.error(error);
                    isTrDayCompleteSubscription.unsubscribe();
                }
            )
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
                        _this.checkStatus();
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
                        _this.checkStatus();
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

    updateStatusLocally() {
        let _this = this;
        if(_this.lastStatus) {
            if(_this.lastStatus.data.status === 'running') {
                const elapsedMilliseconds: number = Date.now() - _this.lastStatusUpdate;
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
            else {
                _this.statusUpdated.emit(_this.lastStatus);
            }
        }
        else {
            setTimeout(() => {
                _this.checkStatus();
            }, 1000);
        }

    }

    isStatusDifferent(oldStatus: any, newStatus: any) {
        if(
            oldStatus.data.codice_azienda !== newStatus.data.codice_azienda ||
            oldStatus.data.codice_compito !== newStatus.data.codice_compito ||
            oldStatus.data.id_cons !== newStatus.data.id_cons ||
            oldStatus.data.date_time_begin !== newStatus.data.date_time_begin ||
            oldStatus.data.description !== newStatus.data.description ||
            oldStatus.data.status !== newStatus.data.status            
        ) {
            return true;
        }
        return false;
    }
}

