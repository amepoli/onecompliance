import { Injectable } from '@angular/core';
import { SweetAlertResult } from 'sweetalert2';
import * as appData from '../../../../appdata.json';
import { ILoggerService, MessageElement, MessageItem } from '../interfaces';
import { FormActionType } from '../types';
import { BackendService } from './backend.service';
import { ConsoleLoggerService } from './console_logger.service';
import { DialogService } from './dialog.service';
import { TimeTrackerService } from './time_tracker.service';
import { ToastService } from './toast.service';

@Injectable({
    providedIn: 'root'
})

export class ActionsService {

    constructor(
        private _dialogService: DialogService, 
        private backendService: BackendService, 
        private _toastService: ToastService,
        private _console: ConsoleLoggerService,
        private _timeTrackerService: TimeTrackerService) {
    }
    public getFormActionMessage(actionType: FormActionType, messages: MessageElement[]) {
        let result: MessageItem = null;
        if (messages != null && messages.length > 0) {
            let messageElements = messages.filter(m => m.messageType === actionType);
            if (messageElements && messageElements.length > 0) {
                result = {
                    title: messageElements[0].message.title,
                    text: messageElements[0].message.text
                };
            }
        }
        return result;   
    }

    public async performFormAction(actionType: FormActionType, messages: MessageElement[], entryName: string, company: string, keys: any, ){
        var _this = this;
        let message: MessageItem = _this.getFormActionMessage(actionType, messages);
        if(message) {
            // Show confirmation dialog to make sure user wants to perform action
            let dialogResult: SweetAlertResult<any> = await _this._dialogService.showConfimationDialog(message.title, message.text, "Yes", "No", "warning");
            if(!dialogResult.isConfirmed) {
                return;
            }
        }

        const subscription = _this.backendService.performFormAction(actionType, entryName, company, keys ).subscribe(
            result => {
                _this._console.log(result);
                if (result.result === 'OK') {
                    // Show success toast
                    _this._toastService.showSuccessToast(actionType + " successful!");

                    if(actionType === 'startEvent' || actionType === 'stopEvent') {
                        _this._timeTrackerService.checkStatus();
                    }
                }
                else {
                    let errors = result.reason;
                    if(Array.isArray(result.reason)) {
                        errors = result.reason.join('\n');
                    }
                    _this._dialogService.showErrorDialog("Error", errors);
                    // // Show error snackbar
                    // _this._toastService.showErrorToast(result.reason);
                }
                subscription.unsubscribe();
            },
            error => {
                // Show error snackbar
                _this._toastService.showErrorToast(error);
                subscription.unsubscribe();
            }
        );
    }
}