import { Injectable, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';
// import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { Observable, BehaviorSubject } from 'rxjs';
import { ToastService } from './toast.service';
import { ActivatedRoute, Router } from '@angular/router';
import { BackendService } from './backend.service';
import { PubSubService } from 'app/oc/services/pubsub.service';
import { AuthService } from './auth.service';
import { DialogService } from './dialog.service';
import { MatDialog } from '@angular/material/dialog';
import { ImportDialogComponent } from '../dialogs/import.dialog/import.dialog.component';
import { ConsoleLoggerService } from './console_logger.service';
import { ExportItem, ExportList, ImportItem, ImportList } from '../interfaces';

@Injectable({
    providedIn: 'root'
})
export class TimezoneService {

    private apiInfoUrl: string = 'https://worldtimeapi.org/api/ip';
    public timezoneInfo: any = {
        abbreviation: null,
        client_ip: null,
        datetime: null,
        day_of_week:1,
        day_of_year:1,
        dst: false,
        dst_from: null,
        dst_offset: 0,
        dst_until: null,
        raw_offset: 0,
        timezone: null,
        unixtime: 0,
        utc_datetime: null,
        utc_offset: null,
        week_number: 0
    };

    /**
     * Constructor
     *
     */
    constructor(
        private _http: HttpClient,
        private _toastService: ToastService
    ) {
        const _this = this;
        _this.getTimezoneInfo();
    }

    /**
     * Get Timezone info
     * @returns timezone
     */
    getTimezoneInfo() {
        let _this = this;
        _this._http.get(_this.apiInfoUrl, { observe: 'response' }).subscribe(
            result => {
                console.log(result);
                _this.timezoneInfo = result.body;
                localStorage.setItem('timezoneInfo', JSON.stringify(result.body));
            },
            error => {
                let timezoneInfoLocal = localStorage.getItem('timezoneInfo');
                if(timezoneInfoLocal && timezoneInfoLocal.length > 10) {
                    _this.timezoneInfo = JSON.parse(timezoneInfoLocal);
                }
                else {
                    _this._toastService.showErrorToast(error);
                }
            }
        );
    }

}

