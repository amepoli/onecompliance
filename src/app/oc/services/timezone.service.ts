import { Injectable, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ToastService } from './toast.service';
import { HelperService } from './helper.service';

@Injectable({
    providedIn: 'root'
})
export class TimezoneService {

    private useApi = false;

    private apiInfoUrl: string = 'https://worldtimeapi.org/api/ip';
    public timezoneInfo: any = {
        // abbreviation: null,
        // client_ip: null,
        // datetime: null,
        // day_of_week:1,
        // day_of_year:1,
        // dst: false,
        // dst_from: null,
        // dst_offset: 0,
        // dst_until: null,
        // raw_offset: 0,
        timezone: null,
        // unixtime: 0,
        // utc_datetime: null,
        utc_offset: null,
        // week_number: 0
    };

    /**
     * API Sample response
    {
        abbreviation: "PKT",
        client_ip: "182.178.243.167",
        datetime: "2023-11-23T16:23:26.800194+05:00",
        day_of_week: 4,
        day_of_year: 327,
        dst: false,
        dst_from: null,
        dst_offset: 0,
        dst_until: null,
        raw_offset: 18000,
        timezone: "Asia/Karachi",
        unixtime: 1700738606,
        utc_datetime: "2023-11-23T11:23:26.800194+00:00",
        utc_offset: "+05:00",
        week_number: 47,
    }
    */
   
    /**
     * Constructor
     *
     */
    constructor(
        private _http: HttpClient,
        private _toastService: ToastService
    ) {
        const _this = this;
        setTimeout(() => _this.getTimezoneInfo(), 2000);
    }

    /**
     * Get Timezone info
     * @returns timezone
     */
    getTimezoneInfo() {
        let _this = this;

        if(_this.useApi) {
            _this._http.get(_this.apiInfoUrl, { observe: 'response' })
            .subscribe(
                result => {
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
        else {
            const localOffset = new Date().getTimezoneOffset() * -1;
            const localOffsetAbs = Math.abs(localOffset);
            const hours = localOffsetAbs/60;
            const minutes = localOffsetAbs%60;
            const utc_offset = (localOffset < 0? "-": "+") + HelperService.getTwoDigitText(hours) + ":" + HelperService.getTwoDigitText(minutes);
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
            _this.timezoneInfo.utc_offset = utc_offset;
            _this.timezoneInfo.timezone = timezone;
            localStorage.setItem('timezoneInfo', JSON.stringify(_this.timezoneInfo));
        }
    }

}

