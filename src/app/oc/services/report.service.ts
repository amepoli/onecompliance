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
import { ConsoleLoggerService } from './console_logger.service';
import { ReportList } from '../interfaces';
import { HelperService } from './helper.service';

@Injectable({
    providedIn: 'root'
})
export class ReportService // implements Resolve<any>
{
    // Reports lazy loading
    isLazyLoadingEnabled = true;
    lazyLoadingEntryName: string;

    public cache = {};

    // local data
    private _currentData: ReportList = {
        entryName: "",
        lazyLoaded: false,
        reports: []
    };

    // get current data
    public getCurrentData() {
        return this._currentData;
    }

    // Stream for loaded reports
    public onReportsLoaded: BehaviorSubject<ReportList>;

    // Event Emitter for reload requests
    public reloadRequested: EventEmitter<string> = new EventEmitter();

    // Event Emitter for getting report requests
    public getReportRequested: EventEmitter<string> = new EventEmitter();

    // Event Emitter for clear requests
    public lazyLoadingListening: EventEmitter<any> = new EventEmitter();

    

    /**
     * Constructor
     *
     * @param {HttpClient} _httpClient
     * @param {BackendService} _backendService
     * @param {ToastService} _toastService
     * @param {DialogService} _dialogService
     */
    constructor(
        private _httpClient: HttpClient,
        private _backendService: BackendService,
        private _toastService: ToastService,
        private _dialogService: DialogService,
        private _console: ConsoleLoggerService

    ) {
        // Set the defaults
        this.onReportsLoaded = new BehaviorSubject({ entryName: "", lazyLoaded: false, reports: [] });

    }

    getReport(entryName: string, company: string, keys: any, alias: string, isForm: boolean, searchKeys: any) {
        let _this = this;
        _this._dialogService.showLoadingDialog("Getting report", "Please wait...");

        _this._backendService.getReport(entryName, company, keys, alias, isForm, searchKeys).subscribe(
            response => {
                _this._console.log(response);
                if (response.result === 'OK') {
                    const url = response.url;
                    _this._httpClient.get(url, { responseType: 'blob' }).subscribe(
                        fileData => {
                            const keysString = Object.keys(keys).map(key => keys[key]).join("_");
                            const entryNameLength = Math.min(entryName.length, 4);
                            const entryNameShort = entryName.substring(0, entryNameLength);
                            // Save the file 
                            saveAs(fileData, `${keysString}_${entryNameShort}_${HelperService.getFormattedShortDate(new Date())}.pdf`);

                            // Close dialog and show success toast
                            _this._dialogService.closeDialog();
                            _this._toastService.showSuccessToast("Report downloaded successfully!");
                        },
                        error => {
                            // Show error snackbar
                            _this._dialogService.closeDialog();
                            _this._toastService.showErrorToast(error);
                        });
                }
                else {
                    // Show error snackbar
                    _this._dialogService.closeDialog();
                    _this._toastService.showErrorToast(response.reason);
                }
            },
            error => {
                // Show error snackbar
                _this._dialogService.closeDialog();
                _this._toastService.showErrorToast(error);
            }
        );
    }

    getReports(entryName: string, company: string, keys: any, isForm: boolean) {
        let _this = this;

        // If alread in cache, return it
        if(_this.cache[entryName]) {
            // Reset stored data
            _this._currentData = _this.cache[entryName];

            // now give results back to the requester
            _this.onReportsLoaded.next(_this._currentData);
        }
        else {
            if (entryName == 'dashboard') {
                // Reset stored data
                _this._currentData = {
                    entryName: entryName,
                    lazyLoaded: _this.isLazyLoadingEnabled,
                    reports: []
                };
    
                // Save in cache
                _this.cache[entryName] = _this._currentData;
                            
                // now give results back to the requester
                _this.onReportsLoaded.next(_this._currentData);
            }
            else {
                _this._backendService.getReportList(entryName, company, keys, isForm).subscribe(
                    response => {
                        _this._console.log(response);
                        if (response.result === 'OK') {
                            // Store data locally
                            _this._currentData = {
                                entryName: entryName,
                                lazyLoaded: _this.isLazyLoadingEnabled,
                                reports: response.list
                            };
    
                            // Save in cache
                            _this.cache[entryName] = _this._currentData;
    
                            // now give results back to the requester
                            _this.onReportsLoaded.next(_this._currentData);
                        }
                        else {
                            // Reset stored data
                            _this._currentData = {
                                entryName: entryName,
                                lazyLoaded: _this.isLazyLoadingEnabled,
                                reports: []
                            };
    
                            // Save in cache
                            _this.cache[entryName] = _this._currentData;
    
                            // now give results back to the requester
                            _this.onReportsLoaded.next(_this._currentData);
    
                            // Show error snackbar
                            _this._toastService.showErrorToast(response.reason);
                        }
                    },
                    error => {
                        // Error occured!
                        _this._dialogService.closeDialog();
                        _this._toastService.showErrorToast("An error occured!", error);
    
                    }
                );
            }
        }
    }

    requestReload(entryName) {
        let _this = this;
        
        // Request only if we already don't have the reports for this entryName
        if(_this.cache[entryName]) {
            // Save in cache
            _this.cache[entryName].lazyLoaded = false;
            _this._currentData = _this.cache[entryName];
            
            // now give results back to the requester
            _this.onReportsLoaded.next(_this._currentData);
        }
        else if (_this._currentData.entryName !== entryName) {
            _this.reloadRequested.emit(entryName);
        }
    }

    requestGetReport(alias) {
        // Request if report with alias exists in current reports list
        if (this._currentData.reports.filter(x => x.alias === alias).length > 0) {
            this.getReportRequested.emit(alias);
        }
    }

    prepareLazyLoad(entryName: string) {
        this.lazyLoadingEntryName = entryName;
        this.lazyLoadingListening.emit(true);
    }

    requestLazyReload() {
        if(this.lazyLoadingEntryName) {
            this.requestReload(this.lazyLoadingEntryName);
        }
    }

}
