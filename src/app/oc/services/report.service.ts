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
    // local data
    private _currentData: ReportList = {
        entryName: "",
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
        this.onReportsLoaded = new BehaviorSubject({ entryName: "", reports: [] });

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

        if (entryName == 'dashboard') {
            // Reset stored data
            _this._currentData = {
                entryName: entryName,
                reports: []
            };

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
                            reports: response.list
                        };

                        // now give results back to the requester
                        _this.onReportsLoaded.next(_this._currentData);
                    }
                    else {
                        // Reset stored data
                        _this._currentData = {
                            entryName: entryName,
                            reports: []
                        };

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

    requestReload(entryName) {
        // Request only if we already don't have the reports for this entryName
        if (this._currentData.entryName !== entryName) {
            this.reloadRequested.emit(entryName);
        }
    }

    requestGetReport(alias) {
        // Request if report with alias exists in current reports list
        if (this._currentData.reports.filter(x => x.alias === alias).length > 0) {
            this.getReportRequested.emit(alias);
        }
    }
}
