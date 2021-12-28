import { Component, Input, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, AfterViewInit, DoCheck, OnChanges, OnDestroy } from '@angular/core';

import 'rxjs/add/operator/filter';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { HelperService, TimeTrackerService } from 'app/oc/services';

@Component({
    selector: 'time-tracker',
    templateUrl: './time-tracker.component.html',
    styleUrls: ['./time-tracker.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimeTrackerComponent implements DoCheck, AfterViewInit, OnDestroy {

    data: any = null;
    elapsedTime: string = null;
    descriptionColor: string = 'black';
    
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

        // Receive Event Time Tracker Description color()
        _this.subscriptions.push(_this._timeTrackerService.descriptionColorUpdated.subscribe((status) => {
            _this.descriptionColor = status || 'blue';
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
        this._timeTrackerService.updateStatusLocally();
    }

    startTimer() {
        this._timeTrackerService.startTimer(this.data);
    }

    stopTimer() {
        this._timeTrackerService.stopTimer(this.data);
    }

    gotoTaskDetails() {
        let keys = {codice_azienda: this.data.codice_azienda, codice_compito: this.data.codice_compito}
        HelperService.navigateTo('compiti_consultant_micro_task', 'form', keys);
    }

    gotoConsultantDetails() {
        let keys = {codice_azienda: this.data.codice_azienda, id_cons: this.data.id_cons}
        HelperService.navigateTo('consuntivazioni_consultant_list', 'form', keys);    
    }

    gotoAziendeTasks() {
        HelperService.redirectTo(this._router, `/oc/main-table/aziende_tasks`);
    }

    gotoConsultantList() {
        HelperService.redirectTo(this._router, `/oc/main-table/consuntivazioni_consultant_list`);
    }

    gotoTasksList() {
        HelperService.redirectTo(this._router, `/oc/main-table/compiti_consultant_micro_task`);
    }
}
