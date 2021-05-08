import { Component, Input, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, AfterViewInit, DoCheck, OnChanges } from '@angular/core';

import 'rxjs/add/operator/filter';
import { FormViewComponent } from '../form/form-view.component';
import { NavigationService } from 'app/gorico/services/navigation.service';
import { AuthService } from 'app/gorico/login-page/auth.service';
import { BackendService } from '../backend/backend.service';
import { HelperService } from 'app/gorico/services/helper.service';
import { ToastService } from 'app/gorico/services/toast.service';

@Component({
    selector: 'time-tracker',
    templateUrl: './time-tracker.component.html',
    styleUrls: ['./time-tracker.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimeTrackerComponent implements DoCheck, AfterViewInit {

    userCompanies: string[] = [];
    userdata: any;
    data: any = null;
    elapsedTime: string = null;
    
    constructor(
        private cdr: ChangeDetectorRef, 
        private _authService: AuthService, 
        private _backendService: BackendService,
        private _toastService: ToastService) {
        // get user data after login
        this.userdata = this._authService.userinfo.getValue();
        
        // set the company set
        this.userCompanies = this.userdata.companies;

    }

    ngDoCheck() {
        this.cdr.detectChanges();
    }

    ngAfterViewInit() {
        // this.checkTimerStatus();
        setInterval(() => this.checkTimerStatus(), 1000);
    }

    checkTimerStatus() {
        let _this = this;
        const company = _this._authService.getCurrentCompany();
        if(company) {
            _this._backendService.checkTimerStatus(company).subscribe(
                result => {
                    if (result.result === 'OK' && result.data) {
                        if (Array.isArray(result.data)) {
                            _this.data = result.data[0];
                        }
                        else {
                            _this.data = result.data;
                        }
                        _this.elapsedTime = HelperService.getTwoDigitText(_this.data.elapsed_time.hours? _this.data.elapsed_time.hours: 0) + ':' +
                        HelperService.getTwoDigitText(_this.data.elapsed_time.minutes? _this.data.elapsed_time.minutes: 0) + ':' +
                        HelperService.getTwoDigitText(_this.data.elapsed_time.seconds? _this.data.elapsed_time.seconds: 0)
                    }
                    else {
                        _this.data = null;
                    }
                },
                error => {
                    console.error(error)
                }
            );
        }
    }

    startTimer() {
        let _this = this;
        if(_this.data) {
            _this._backendService.startTimer(_this.data.codice_azienda, _this.data.codice_compito).subscribe(
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
                    console.error(error)
                }
            );
        }
    }

    stopTimer() {
        let _this = this;
        if(_this.data) {
            _this._backendService.stopTimer(_this.data.codice_azienda).subscribe(
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
                    console.log(result);
                },
                error => {
                    console.error(error)
                }
            );
        }
    }
}
