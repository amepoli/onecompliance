import { Component, OnInit, ViewChild, ElementRef, AfterContentInit, OnDestroy } from '@angular/core';

import { Router, ActivatedRoute } from '@angular/router';

import { BackendService } from 'app/gorico/views/backend/backend.service'

import { tableViewParams } from 'app/gorico/views/table/table-view.component';
import { formViewParams } from '../views/form/form-view.component';
import { TabType, BottomTabsComponent } from '../bottom-tabs/bottom-tabs.component';
import { NgxPubSubService } from '@pscoped/ngx-pub-sub';
import { Location } from '@angular/common';
import { Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../login-page/auth.service';
import { ToastService } from 'app/gorico/services/toast.service';
import { DialogService } from '../services/dialog.service';


@Component({
    selector: 'main-table',
    templateUrl: './main-table.component.html',
    styleUrls: ['./main-table.component.scss']
})



export class MainTableComponent implements OnInit, OnDestroy {

    loadTable = false;

    showTabs = false;

    fullScreenTab = false;

    tabs: TabType[] = [];

    public navigationHistory: { level: number, tableName: string, type: string, tableKeys: any, primaryKeys: any, params: any, description: string }[] = [];

    private tableParams: tableViewParams = {
        entryName: '',
        keys: {},
        showHeader: true,
        showFullScreenButton: false
    };

    private formParams: formViewParams = {
        entryName: '',
        keys: {},
        index: 0,
        total: 0,
        isNew: false,
        showNavBar: true
    };

    private level = 0;  // current depth of navigation

    private tableName: string;

    public tableType: string;

    public currentDescription: string;

    private currentTableKeys = {};  // keys set in currently active table/subtable (might be foreing keys of subtable)

    private currentPrimaryKeys: any[]; // current list of primary keys provided by the table-view

    private subscriptions: Subscription[] = [];

    public tabsSaveData = false;

    private searchKeys: any;

    // toolbar pub/sub topics
    subMsgCmdTopic = '/toolbar/out/cmd';
    pubMsgCmdTopic = '/toolbar/in/cmd';

    @ViewChild('List') private List: ElementRef;
    @ViewChild('Tabs') private Tabs: BottomTabsComponent;

    constructor(
        protected route: ActivatedRoute,
        protected router: Router,
        protected backendService: BackendService,
        private pubSubService: NgxPubSubService,
        private authService: AuthService,
        protected location: Location,
        private httpClient: HttpClient,
        private _toastService: ToastService,
        private _dialogService: DialogService) {
    }

    ngOnInit(): void {

        const _this = this;

        _this.route.params
            .subscribe(params => {
                _this.navigationHistory.length = 0;       // flush navigation history
                _this.level = 0;
                _this.resetFormParams();
                _this.tableName = params.table_name;
                _this.currentDescription = 'Tabella ' + _this.tableName;
                _this.tableType = 'table';           // only table views from left navigation bar
                // check if we are coming from dashboard 
                _this.currentTableKeys = (_this.backendService.dashboardKeys != null) ?
                    _this.backendService.dashboardKeys : _this.backendService.globalTableKeys;
                _this.backendService.dashboardKeys = null; // reset dashboard path
                _this.tableParams = { entryName: _this.tableName, keys: _this.currentTableKeys, showHeader: true, showFullScreenButton: false };
            });

        // subscribe to toolbar requests
        _this.subscriptions.push(_this.pubSubService.subscribe(_this.subMsgCmdTopic,
            msg => {
                if (msg.type === 'print_list') {   // toolbar asking for the list of possible reports in current view
                    _this.backendService.getReportList(_this.tableName, _this.currentTableKeys).subscribe(
                        response => {
                            console.log(response);
                            if (response.result === 'OK') {
                                // now give results back to the requester
                                _this.pubSubService.publishEvent(_this.pubMsgCmdTopic, { type: 'print_list', value: response.list });
                            }
                            else {
                                // Show error snackbar
                                _this._toastService.showErrorToast(response.reason);
                            }
                        });
                } else if (msg.type === 'print_item') {  // toolbar asking for producing a specific report 
                    _this.backendService.getReport(_this.tableName, (_this.tableType === 'table') ? _this.currentTableKeys : _this.formParams.keys, msg.value, (_this.tableType === 'form'), _this.searchKeys).subscribe(
                        response => {
                            console.log(response);
                            if (response.result === 'OK') {
                                const url = response.url.replace('https', 'http'); // avoid the browser complaining about certificates 
                                _this.httpClient.get(url, { responseType: 'blob' }).subscribe(
                                    fileData => {
                                        saveAs(fileData, 'report.pdf');
                                    });
                            }
                            else {
                                // Show error snackbar
                                _this._toastService.showErrorToast(response.reason);
                            }
                        });
                } else if (msg.type === 'add') { // toolbar sking for adding a new element
                    _this.historyPush();
                    _this.currentDescription = 'Nuovo elemento tabella ' + _this.tableName;
                    _this.formParams = {
                        entryName: _this.tableName,
                        index: 1,
                        keys: _this.currentTableKeys,
                        total: 1,
                        isNew: true,
                        showNavBar: false
                    };
                    _this.tableType = 'form';  // push the visualization only at this point, needed if moving from table to form view
                } else if (msg.type === 'list') { // toolbar asking to go back to list
                    if (_this.navigationHistory.length) {
                        _this.historyPop(_this.navigationHistory[0]); // go back to the root element
                    }
                } else if (msg.type === 'get_excel') {  // get the excel sheet
                    // Show loading Dialog
                    _this._dialogService.showLoadingDialog("Preparing Excel Sheet", "Please wait...");

                    _this.backendService.getData(_this.tableName, _this.authService.getCurrentCompany(), (_this.tableType === 'table') ? _this.currentTableKeys : _this.formParams.keys, _this.searchKeys,
                        (_this.tableType === 'form'), false, null, true).subscribe(
                            response => {
                                _this._dialogService.closeDialog();
                                console.log(response);
                                if (response.result === 'OK') {
                                    // File is okay.
                                    // Let's try to download it using simple window method first
                                    let downloadWindow = window.open(response.url, "_blank");

                                    // Check if the browser allowed window.open function
                                    if (downloadWindow) {
                                        // Window opened so must have downloaded
                                        // Show success toast
                                        _this._toastService.showSuccessToast("", "Excel sheet downloaded successfully!");
                                    }
                                    else {
                                        // Window did not open so let's try the manual download methond
                                        // Download the file as blob
                                        _this.httpClient.get(response.url, { responseType: 'blob' }).subscribe(
                                            fileData => {
                                                // File downloaded
                                                // Get file name
                                                let parts = response.url.split('/');
                                                let fileName = parts[parts.length - 1].split('?')[0];

                                                // Let's save it
                                                saveAs(fileData, fileName);

                                                // Show success toast
                                                _this._toastService.showSuccessToast("", "Excel sheet downloaded successfully!");
                                            });
                                    }
                                }
                                else {
                                    // File did not succeed, show error message
                                    _this._toastService.showErrorToast("An error occured!", "An error occured!")
                                }
                            });
                }
            })
        );
    }

    ngOnDestroy() {
        this.subscriptions.forEach(subscription => { subscription.unsubscribe(); });
    }

    onEvent(event: any) {

        const _this = this;
        let newIndex = 0; // only modified if a navigation event is coming from the form-view
        let newTotal = _this.formParams.total;
        if (event.eventType === 'navigate') {

            // Clear tabs
            this.tabs = [];
            this.showTabs = false;

            // scroll to top within all parent list of elements
            _this.List.nativeElement.scrollTop = 0;
            let parentElement = _this.List.nativeElement.parentElement;
            while (parentElement != null) {
                parentElement.scrollTop = 0;
                parentElement = parentElement.parentElement;
            }
            _this.fullScreenTab = false; // reset in case of fullScreen Tab view
            _this.historyPush();  // save current status

            _this.currentPrimaryKeys = event.queryParams.keys; // update
            _this.tableName = event.queryParams.entry.name;
            if (event.queryParams.entry.type === 'table') {
                _this.tableParams = { entryName: _this.tableName, keys: _this.currentTableKeys, showHeader: true, showFullScreenButton: false };
                _this.tableType = 'table';
                _this.currentDescription = 'Tabella ' + _this.tableName;
            } else if (event.queryParams.entry.type === 'form') { // handled later on
                newIndex = event.queryParams.index;
                newTotal = event.queryParams.total;
                _this.currentDescription = 'Dettaglio ' + _this.tableName;
            }

        } else if (event.eventType === 'first') {
            newIndex = 1;
        } else if (event.eventType === 'last') {
            newIndex = _this.formParams.total;
        } else if (event.eventType === 'prev') {
            if (_this.formParams.index > 1) {
                newIndex = _this.formParams.index - 1;
            }
        } else if (event.eventType === 'next') {
            if (_this.formParams.index < _this.formParams.total) {
                newIndex = (Number(_this.formParams.index) + 1);
            }
        } else if (event.eventType === 'tabData') {
            if (event.queryParams.tabs != null) {
                // fill the bottom tabs
                this.tabs = event.queryParams.tabs;
                this.showTabs = true;
            } else {
                this.showTabs = false;
            }
        } else if (event.eventType === 'fullScreen') {
            this.fullScreenTab = event.queryParams.value;
        } else if (event.eventType === 'currentTableKeys') {  // table in subtable view providing its current keys
            this.currentTableKeys = event.queryParams.keys;
        } else if (event.eventType === 'deletedForm') {
            _this.historyPop(_this.navigationHistory[_this.level - 1]); // go back
        } else if (event.eventType === 'gotSave') { // user pressed save button on form-view
            _this.tabsSaveData = !_this.tabsSaveData;  // forward it to the tabs view toggling the variable
        } else if (event.eventType === 'searchKeys') { // used to filter out printed report
            _this.searchKeys = event.queryParams.keys;
        } else {
            return; // not handled
        }

        if (newIndex) { // 
            _this.formParams = {
                entryName: _this.tableName,
                index: newIndex,
                keys: _this.currentPrimaryKeys[newIndex - 1],
                total: newTotal,
                isNew: false,
                showNavBar: _this.formParams.showNavBar
            };
            _this.tableType = 'form';  // push the visualization only at this point, needed if moving from table to form view
        }


    }

    fullView(): void {
        // toggle full view
    }

    // retrieve an element from history and handle the history list consequently
    historyPop(item: any): void {
        const _this = this;
        _this.fullScreenTab = false; // reset in case of fullScreen Tab view
        _this.navigationHistory.length = item.level; // remove itself and following history elements 
        _this.level = item.level;
        if (!_this.level) { // if root (i.e. table) reset form params
            _this.resetFormParams();
        }
        _this.currentTableKeys = item.tableKeys;
        _this.tableName = item.tableName;
        _this.currentPrimaryKeys = item.primaryKeys;
        if (item.type === 'table') {
            _this.tableParams = item.params;
            _this.currentDescription = 'Tabella ' + _this.tableName;
            _this.tableType = 'table';
        } else {
            _this.formParams = item.params;
            _this.currentDescription = 'Dettaglio ' + _this.tableName;
            _this.tableType = 'form';
        }
    }

    // push current state on history list stack and move forward by one level
    historyPush(): void {
        const _this = this;
        const currentNavigation = {
            level: _this.level,
            tableName: _this.tableName,
            type: _this.tableType,
            tableKeys: _this.currentTableKeys,
            primaryKeys: _this.currentPrimaryKeys,
            params: _this.tableType === 'table' ? _this.tableParams : _this.formParams,
            description: _this.currentDescription
        };
        _this.navigationHistory.push(currentNavigation);
        _this.level = _this.level + 1; // going in depth
    }

    resetFormParams() {
        const _this = this;
        _this.formParams = {
            entryName: '',
            keys: {},
            index: 0,
            total: 0,
            isNew: false,
            showNavBar: true
        };
    }

}




