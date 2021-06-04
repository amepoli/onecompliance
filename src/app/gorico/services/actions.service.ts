import { Injectable } from '@angular/core';
import * as appData from '../../../../appdata.json';
import { ILoggerService, MessageElement, MessageItem } from '../interfaces';
import { FormActionType } from '../types';
import { BackendService } from './backend.service';
import { ConsoleLoggerService } from './console_logger.service';
import { DialogService } from './dialog.service';
import { ToastService } from './toast.service';

@Injectable({
    providedIn: 'root'
})

export class ActionsService {

    constructor(
        private _dialogService: DialogService, 
        private backendService: BackendService, 
        private _toastService: ToastService,
        private _console: ConsoleLoggerService) {

    }
    public getFormActionMessage(actionType: FormActionType, messages: MessageElement[]) {
        let result: MessageItem = {
            title: actionType,
            text: "Are you sure you want to perform action?"
        };
        if (messages != null && messages.length) {
            let messageElements = messages.filter(m => m.messageType === actionType);
            if (messageElements && messageElements.length) {
                result.title = messageElements[0].message.title;
                result.text = messageElements[0].message.text;
            }
        }
        return result;   
    }

    public performFormAction(actionType: FormActionType, messages: MessageElement[], entryName: string, company: string, keys: any, ){
        var _this = this;
        let message: MessageItem = _this.getFormActionMessage(actionType, messages);

        // Show confirmation dialog to make sure user wants to perform action
        _this._dialogService.showConfimationDialog(message.title, message.text, "Yes", "No", "warning").then((result) => {
            if (result.value === true) {
                // User said yes so let's perform action
                const subscription = _this.backendService.performFormAction(actionType, entryName, company, keys ).subscribe(
                    result => {
                        _this._console.log(result);
                        if (result.result === 'OK') {
                            // Show success toast
                            _this._toastService.showSuccessToast(actionType + " successful!");
                        }
                        else {
                            // Show error snackbar
                            _this._toastService.showErrorToast(result.reason);
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
        });
    }
}