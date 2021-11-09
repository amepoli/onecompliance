import { Component, OnInit, ViewChild, ElementRef, AfterContentInit, OnDestroy, HostListener, ChangeDetectorRef, AfterViewInit } from '@angular/core';

import { Router, ActivatedRoute } from '@angular/router';


import { TableViewComponent } from 'app/oc/views/table/table-view.component';
import { FormViewComponent } from '../views/form/form-view.component';
import { BottomTabsComponent } from '../bottom-tabs/bottom-tabs.component';
import { Location } from '@angular/common';
import { Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { FormViewParams, MessageView, TableViewParams, TabType } from '../interfaces';
import { AuthService, BackendService, ConsoleLoggerService, DialogService, HelperService, ImportExportService, NavigationService, PubSubService, ReportService, ScrollService, TimeTrackerService, ToastService } from '../services';

@Component({
    selector: 'homepage',
    templateUrl: './homepage.component.html',
    styleUrls: ['./homepage.component.scss']
})

export class HomepageComponent implements OnInit, AfterViewInit, OnDestroy {

    tabs: any = null;
    activeTab = 0;
    tiles: any = [];

    constructor(
        protected route: ActivatedRoute,
        protected router: Router,
        protected backendService: BackendService,
        private pubSubService: PubSubService,
        private authService: AuthService,
        protected location: Location,
        private httpClient: HttpClient,
        private _toastService: ToastService,
        private _dialogService: DialogService,
        private _importExportService: ImportExportService,
        private _reportService: ReportService,
        private _navigationService: NavigationService,
        private _cdr: ChangeDetectorRef,
        private _timeTrackerService: TimeTrackerService,
        private _console: ConsoleLoggerService) {
    }

    ngOnInit(): void {

        const _this = this;

        this.tiles = [];
        
        _this.backendService.loadHomePage('zee', _this.authService.getCurrentCompany({})).subscribe(
            result => {
                _this.tabs = result.response.tabs;
                console.log(result)
            },
            error => {
                console.error(error)
            }
        );
    }

    ngAfterViewInit() {
        
    }

    ngOnDestroy() {
        
    }

    handleScroll($event) {
       
    }

    reload() {
        this._console.log('onReload: homepage');
    }

    changeTab(i) {
        let _this = this;
        _this.activeTab = i;
        _this.backendService.loadHomePageTab(_this.tabs[i].entry,  _this.authService.getCurrentCompany({})).subscribe(
            response => {
                console.log(response);
                if(response.result === 'OK') {
                    _this.tiles = response.response.tiles;
                }
            },
            error => {
                _this._toastService.showErrorToast(error);
            }
        )
    }

}
