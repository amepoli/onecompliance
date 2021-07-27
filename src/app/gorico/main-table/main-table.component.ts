import { Component, OnInit, ViewChild, ElementRef, AfterContentInit, OnDestroy, HostListener, ChangeDetectorRef, AfterViewInit } from '@angular/core';

import { Router, ActivatedRoute } from '@angular/router';


import { TableViewComponent } from 'app/gorico/views/table/table-view.component';
import { FormViewComponent } from '../views/form/form-view.component';
import { BottomTabsComponent } from '../bottom-tabs/bottom-tabs.component';
import { Location } from '@angular/common';
import { Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { FormViewParams, MessageView, TableViewParams, TabType } from '../interfaces';
import { AuthService, BackendService, ConsoleLoggerService, DialogService, HelperService, ImportExportService, NavigationService, PubSubService, ReportService, ScrollService, TimeTrackerService, ToastService } from '../services';

@Component({
    selector: 'main-table',
    templateUrl: './main-table.component.html',
    styleUrls: ['./main-table.component.scss']
})

export class MainTableComponent implements OnInit, AfterViewInit, OnDestroy {

    loadTable = false;

    showTabs = false;

    fullScreenTab = false;

    tabs: TabType[] = [];

    public navigationHistory: { level: number, tableName: string, type: string, tableKeys: any, primaryKeys: any, params: any, description: string }[] = [];

    private tableParams: TableViewParams = {
        entryName: '',
        keys: {},
        showHeader: true,
        showFullScreenButton: false
    };

    private formParams: FormViewParams= {
        entryName: '',
        keys: {},
        index: 0,
        total: 0,
        isNew: false,
        showNavBar: true,
        navBarMode: 'detail'
    };

    private level = 0;  // current depth of navigation

    private tableName: string;

    public tableType: string;

    public currentDescription: string;

    private currentTableKeys: any;  // keys set in currently active table/subtable (might be foreing keys of subtable)

    private currentPrimaryKeys: any[]; // current list of primary keys provided by the table-view

    private subscriptions: Subscription[] = [];

    public tabsSaveData = false;

    private searchKeys: any;

    // toolbar pub/sub topics
    subMsgCmdTopic = '/toolbar/out/cmd';
    pubMsgCmdTopic = '/toolbar/in/cmd';

    @ViewChild('List', { static: true }) private List: ElementRef;
    @ViewChild('Tabs') private Tabs: BottomTabsComponent;
    @ViewChild('formView') private formView: FormViewComponent;
    @ViewChild('tableView') private tableView: TableViewComponent;

    @ViewChild('mainTable', { static: true }) mainTable: ElementRef;



    // This is the height available for form
    public formHeight = 1000;

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

        _this.subscriptions.push(_this.route.params
            .subscribe(params => {
                _this.navigationHistory.length = 0;       // flush navigation history
                _this.level = 0;
                _this.resetFormParams();
                _this.tableName = params.table_name;
                _this.currentDescription = 'Tabella ' + _this.tableName;
                _this.tableType = 'table';           // only table views from left navigation bar
                // check if we are coming from dashboard 
                _this.currentTableKeys = (_this.backendService.dashboardKeys != null) ?
                    _this.backendService.dashboardKeys : {};
                _this.backendService.dashboardKeys = null; // reset dashboard path
                _this.tableParams = { entryName: _this.tableName, keys: _this.currentTableKeys, showHeader: true, showFullScreenButton: false };
            }));

        // Receive Navigation Event from Time Tracker Service
        _this.subscriptions.push(_this._timeTrackerService.navigateRequested.subscribe((data) => {
            _this.onEvent(data);
        }));
        
        // Report related subscriptions
        _this.subscriptions.push(_this._reportService.reloadRequested.subscribe((entryName) => {
            if (entryName === _this.tableName) {
                _this._reportService.getReports(_this.tableName, _this.authService.getCurrentCompany(_this.currentTableKeys), _this.currentTableKeys, (_this.tableType === 'form'));
            }
        }));

        _this.subscriptions.push(_this._reportService.getReportRequested.subscribe((alias) => {
            _this._reportService.getReport(_this.tableName, _this.authService.getCurrentCompany(_this.currentTableKeys), (_this.tableType === 'table') ? _this.currentTableKeys : _this.formParams.keys, alias, (_this.tableType === 'form'), _this.searchKeys);
        }));

        // Import Export related subscriptions
        _this.subscriptions.push(_this._importExportService.onGetTemplateRequested.subscribe((entryName) => {
            _this._importExportService.getTemplateFile(_this.tableName);
        }));

        _this.subscriptions.push(_this._importExportService.onImportRequested.subscribe((entryName) => {
            _this._importExportService.importCSV(_this.tableName);
        }));

        _this.subscriptions.push(_this._importExportService.onAdvancedImportRequested.subscribe((label) => {
            _this._importExportService.importAdvancedCSV(_this.tableName, (_this.tableType === 'table') ? _this.currentTableKeys : _this.formParams.keys, label, _this.tableType === 'form');
        }));

        _this.subscriptions.push(_this._importExportService.onGetCSVRequested.subscribe(label => {
            const formValues = _this.getFormValues();
            _this._importExportService.downloadCSV(_this.tableName, _this.authService.getCurrentCompany(_this.currentTableKeys), (_this.tableType === 'table') ? _this.currentTableKeys : _this.formParams.keys, _this.searchKeys, _this.tableType === 'form', formValues, label);
        }));

        _this.subscriptions.push(_this._importExportService.onGetExcelRequested.subscribe(label => {
            const formValues = _this.getFormValues();
            _this._importExportService.downloadExcel(_this.tableName, _this.authService.getCurrentCompany(_this.currentTableKeys), (_this.tableType === 'table') ? _this.currentTableKeys : _this.formParams.keys, _this.searchKeys, _this.tableType === 'form', formValues, label);
        }));

        // subscribe to toolbar requests
        _this.subscriptions.push(_this.pubSubService.subscribe(_this.subMsgCmdTopic,
            msg => {
                // if (msg.type === 'print_list') {   // toolbar asking for the list of possible reports in current view
                //     _this.backendService.getReportList(_this.tableName, _this.authService.getCurrentCompany(), _this.currentTableKeys).subscribe(
                //         response => {
                //             console.log(response);
                //             if (response.result === 'OK') {
                //                 // now give results back to the requester
                //                 _this.pubSubService.publishEvent(_this.pubMsgCmdTopic, { type: 'print_list', value: response.list });
                //             }
                //             else {
                //                 // Show error snackbar
                //                 _this._toastService.showErrorToast(response.reason);
                //             }
                //         });
                // } else if (msg.type === 'print_item') {  // toolbar asking for producing a specific report 
                //     _this.backendService.getReport(_this.tableName, _this.authService.getCurrentCompany(), (_this.tableType === 'table') ? _this.currentTableKeys : _this.formParams.keys, msg.value, (_this.tableType === 'form'), _this.searchKeys).subscribe(
                //         response => {
                //             console.log(response);
                //             if (response.result === 'OK') {
                //                 const url = response.url.replace('https', 'http'); // avoid the browser complaining about certificates 
                //                 _this.httpClient.get(url, { responseType: 'blob' }).subscribe(
                //                     fileData => {
                //                         saveAs(fileData, 'report.pdf');
                //                     });
                //             }
                //             else {
                //                 // Show error snackbar
                //                 _this._toastService.showErrorToast(response.reason);
                //             }
                //         });
                // } else 
                if (msg.type === 'add') { // toolbar asking for adding a new element
                    _this.historyPush();
                    _this.currentDescription = 'Nuovo elemento tabella ' + _this.tableName;
                    _this.formParams = {
                        entryName: _this.tableName,
                        index: 1,
                        keys: _this.formParams.keys,
                        total: 1,
                        isNew: true,
                        showNavBar: true,
                        navBarMode: 'add'
                    };
                    _this.tableType = 'form';  // push the visualization only at this point, needed if moving from table to form view
                } else if (msg.type === 'list') { // toolbar asking to go back to list
                    if (_this.navigationHistory.length) {
                        _this.historyPop(_this.navigationHistory[0]); // go back to the root element
                    }
                } else if (msg.type === 'get_excel') {  // get the excel sheet

                    // Show loading Dialog
                    _this._dialogService.showLoadingDialog("Preparing Excel Sheet", "Please wait...");

                    const subscription = _this.backendService.getData(_this.tableName, _this.authService.getCurrentCompany(_this.currentTableKeys), (_this.tableType === 'table') ? _this.currentTableKeys : _this.formParams.keys, _this.searchKeys,
                        (_this.tableType === 'form'), false, null, true).subscribe(
                            response => {
                                _this._dialogService.closeDialog();
                                _this._console.log(response);
                                if (response.result === 'OK') {
                                    // File is okay.
                                    // Let's try to download it using simple window method first
                                    const downloadWindow = window.open(response.url, "_blank");

                                    // Check if the browser allowed window.open function
                                    if (downloadWindow) {
                                        // Window opened so must have downloaded
                                        // Show success toast
                                        _this._toastService.showSuccessToast("", "Excel sheet downloaded successfully!");
                                    }
                                    else {
                                        // Window did not open so let's try the manual download methond
                                        // Download the file as blob
                                        const inner_subscription = _this.httpClient.get(response.url, { responseType: 'blob' }).subscribe(
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
                                        
                                            _this.subscriptions.push(inner_subscription);
                                    }
                                }
                                else {
                                    // File did not succeed, show error message
                                    _this._toastService.showErrorToast("An error occured!", "An error occured!")
                                }
                            }, error => {
                                // Error occured!
                                _this._dialogService.closeDialog();
                                _this._toastService.showErrorToast("An error occured!", error);

                            });
                    
                        _this.subscriptions.push(subscription);
                }
                // else if (msg.type === 'import') {  // import the excel sheet or csv
                //     _this._importExportService.importCSV(_this.tableName);
                // }
                // else if (msg.type === 'downloadTemplateFile') {  // download Table columns Template File
                //     _this._importExportService.downloadTemplateFile(_this.tableName);
                // }
            })
        );

        // Get available height for form
        this.calculateFormHeight();
    }

    ngAfterViewInit() {
        window.addEventListener('scroll', this.handleScroll.bind(this), true); //third parameter

        this.subscriptions.push(ScrollService.RequestMainTableScrollToTopEventEmitter.subscribe(scroll => {
            this.mainTable.nativeElement.scrollTo(0, 0);
        }));
    }

    ngOnDestroy() {
        this.subscriptions.forEach(subscription => { subscription.unsubscribe(); });
        window.removeEventListener('scroll', this.handleScroll.bind(this), true);
    }

    handleScroll($event) {
        const windowScroll = this.mainTable.nativeElement.scrollTop; //window.pageYOffset;
        ScrollService.MainTableScrollEventEmitter.emit({ x: 0, y: windowScroll });
    }

    onEvent(event: any) {

        const _this = this;
        let newIndex = 0; // only modified if a navigation event is coming from the form-view
        let newTotal = _this.formParams.total;
        if (event.eventType === 'savedForm') { // quick add form view submitted the new record
            if (_this.formView && _this.tableType === 'form' && !_this.fullScreenTab) {
                _this.formView.loadData();
            }
            // _this._cdr.detectChanges();
        }

        if (event.eventType === 'navigate') {

            // Clear tabs
            _this.tabs = [];
            _this.showTabs = false;

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
                _this.tabs = event.queryParams.tabs;
                _this.showTabs = true;
            } else {
                _this.showTabs = false;
            }
        } else if (event.eventType === 'fullScreen') {
            _this.fullScreenTab = event.queryParams.value;
        } else if (event.eventType === 'currentTableKeys') {  // table in subtable view providing its current keys
            _this.currentTableKeys = event.queryParams.keys;
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
                showNavBar: _this.formParams.showNavBar,
                navBarMode: 'detail'
            };
            _this.tableType = 'form';  // push the visualization only at this point, needed if moving from table to form view
        }

        // Calculate form height
        _this.calculateFormHeight();

    }

    fullView(): void {
        // toggle full view
    }

    // retrieve an element from history and handle the history list consequently
    historyPop(item: any): void {
        const _this = this;
        _this.fullScreenTab = false; // reset in case of fullScreen Tab view
        _this.tabs = [];
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

        // Calculate form height
        this.calculateFormHeight();

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
        _this.tabs = [];
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
            showNavBar: true,
            navBarMode: 'detail'
        };
    }

    @HostListener('window:resize', ['$event'])
    onResize(event) {
        // Update form height
        this.calculateFormHeight();
    }

    calculateFormHeight() {
        // if (this.showTabs) {
        //     this.formHeight = ((window.innerHeight - 64) * 0.66)
        //         - 47; // Navibar
        // }
        // else {
        //     this.formHeight = window.innerHeight
        //         - 64 // Titlebar
        //         - 47; // Navibar
        // }

        this.formHeight = window.innerHeight - 64;
    }

    reload() {
        this._console.log('onReload: main-table');
        this.formView.refreshView();
    }

    updateMessages(messageViews: MessageView[], viewType: string) {
    }

    getFormValues(): any {
        const _this = this;
        if (_this.tableType === 'form' && _this.formView != null) {
            return HelperService.getFormValues(_this.formView.formGetter.formArray.first.form.value)
        }
        return {};
    }

}
