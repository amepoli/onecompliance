import { Component, Input, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, AfterViewInit, DoCheck, OnChanges, OnDestroy } from '@angular/core';

import 'rxjs/add/operator/filter';
import { FormViewComponent } from '../form/form-view.component';
import { NavigationService } from 'app/gorico/services/navigation.service';
import { AuthService } from 'app/gorico/login-page/auth.service';
import { BackendService } from '../backend/backend.service';
import { HelperService } from 'app/gorico/services/helper.service';
import { ToastService } from 'app/gorico/services/toast.service';
import { PubSubService } from 'app/gorico/services/pubsub.service';
import { TimeTrackerService } from 'app/gorico/services/time_tracker.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'time-tracker',
    templateUrl: './time-tracker.component.html',
    styleUrls: ['./time-tracker.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimeTrackerComponent implements DoCheck, AfterViewInit, OnDestroy {

    userCompanies: string[] = [];
    userdata: any;
    data: any = null;
    elapsedTime: string = null;
    
    private subscriptions: Subscription[] = [];

    constructor(
        private cdr: ChangeDetectorRef, 
        private _authService: AuthService, 
        private _pubSubService: PubSubService,
        private _backendService: BackendService,
        private _toastService: ToastService,
        private _timeTrackerService: TimeTrackerService) {
        
        let _this = this;
        
        // get user data after login
        this.userdata = this._authService.userinfo.getValue();
        
        // set the company set
        this.userCompanies = this.userdata.companies;

        // Receive Event Time Tracker Service()
        _this.subscriptions.push(_this._timeTrackerService.statusUpdated.subscribe((status) => {
            _this.data = status.data;
            _this.elapsedTime = status.elapsedTime;
        }));
        
    }

    ngDoCheck() {
        this.cdr.detectChanges();
    }

    ngOnDestroy()
    {
        this.subscriptions.forEach(subscription => { subscription.unsubscribe(); });
    }

    
    ngAfterViewInit() {
        // this.checkTimerStatus();
        setInterval(() => this.checkTimerStatus(), 1000);
    }

    checkTimerStatus() {
        this._timeTrackerService.checkTimerStatus();
    }

    startTimer() {
        this._timeTrackerService.startTimer(this.data);
    }

    stopTimer() {
        this._timeTrackerService.stopTimer(this.data);
    }

    navigate() {
        this._timeTrackerService.requestNavigate(this.data);
    }
}
