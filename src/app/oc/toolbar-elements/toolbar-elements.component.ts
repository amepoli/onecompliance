import { Component, OnInit, ViewChild, ElementRef, AfterContentInit, OnDestroy, HostListener, ChangeDetectorRef, AfterViewInit, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';

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
    selector: 'toolbar-elements',
    templateUrl: './toolbar-elements.component.html',
    styleUrls: ['./toolbar-elements.component.scss']
})

export class ToolbarElementsComponent implements OnInit, AfterViewInit, OnDestroy {

    @Input() toolbar_elements: any = [];

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
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.entry && this.toolbar_elements && this.toolbar_elements.length && changes.toolbar_elements.previousValue !== this.toolbar_elements) {
            // Updated
        }
        // Make sure params are different before refreshing view
        // if (!this.addingNew && changes.formParams && this.formParams) {
        //     if (!changes.formParams.previousValue || (JSON.stringify(changes.formParams.previousValue) !== JSON.stringify(changes.formParams.currentValue))) {
        //         this.refreshView();
        //     }
        // } else {
        //     this.addingNew = false;
        // }
        // else {
        //     this.clearForm();
        // }
    }

    ngAfterViewInit() {
    }
    

    ngOnDestroy() {
    }

    updateSearchToggle(index: number, checked: boolean) {
        this.toolbar_elements[index].checked = checked;
    }
    
    

}
