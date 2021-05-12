import { Component, Input, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, AfterViewInit, DoCheck, OnChanges, OnDestroy } from '@angular/core';

import 'rxjs/add/operator/filter';
import { TimeTrackerService } from 'app/gorico/services/time_tracker.service';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';

@Component({
    selector: 'time-tracker',
    templateUrl: './time-tracker.component.html',
    styleUrls: ['./time-tracker.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimeTrackerComponent implements DoCheck, AfterViewInit, OnDestroy {

    data: any = null;
    elapsedTime: string = null;
    
    private subscriptions: Subscription[] = [];

    constructor(
        private cdr: ChangeDetectorRef, 
        private _router: Router,
        private _timeTrackerService: TimeTrackerService) {
        
        let _this = this;
        
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

    gotoTaskDetails() {
        this._timeTrackerService.requestNavigate(this.data);
    }

    gotoAziendeTasks() {
        this._router.navigate([`/gorico/main-table/aziende_tasks`]);
    }

    gotoTasksList() {
        this._router.navigate([`/gorico/main-table/compiti_consultant_micro_task`]);
    }
}
