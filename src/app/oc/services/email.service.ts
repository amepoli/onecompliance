import { EventEmitter, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { EmailActionParameters, FieldConfig, MarkerReplacer } from 'app/oc/interfaces';
import * as moment from 'moment';
import { BackendService } from './backend.service';
import { AuthService } from './auth.service';
import { DialogService } from './dialog.service';
import { ToastService } from './toast.service';
import { PubSubService } from './pubsub.service';
interface TableStyleElement {
    value: string;
    valueKey?: string;
    condition: string;
    style: any;
}

@Injectable({
    providedIn: 'root'
})
export class EmailService {

    
    /**
     * Constructor
     *
     */
    constructor(
        private backendService: BackendService, 
        private authService: AuthService,
        private _dialogService: DialogService,
        private _toastService: ToastService,
        private pubSubService: PubSubService
    ) {
    }

    

    public performSendEmail(event: any, formValues: any, value: any, currentKeys: any) {
        let _this = this;
        let emailActionParameters: EmailActionParameters =
            event.message.actionOnYes.emailActionParameters;

        // process the booleans (1/0 instead of true/false)
        for (const value in formValues) {
            if (formValues.hasOwnProperty(value)) {
                const element = formValues[value];
                if (element == null) {
                    continue; // skip null entries
                }
                // decode combos
                if (element["id"] != null) {
                    formValues[value] = element["id"];
                }

                // encode boolean
                else if (element === true) {
                    formValues[value] = "1";
                } else if (element === false) {
                    formValues[value] = "0";
                }
            }
        }

        let subject = "OneCompliance";
        if (
            emailActionParameters.subjectKeys &&
            emailActionParameters.subjectKeys.length
        ) {
            subject = emailActionParameters.subjectKeys
                .map((key) => formValues[key])
                .join(" ");
        }
        if (
            emailActionParameters.subject &&
            emailActionParameters.subject.length
        ) {
            subject = emailActionParameters.subject;
        }

        let sender = null;
        if (
            emailActionParameters.senderKey &&
            emailActionParameters.senderKey.length
        ) {
            sender = formValues[emailActionParameters.senderKey];
        }
        if (
            emailActionParameters.sender &&
            emailActionParameters.sender.length
        ) {
            sender = emailActionParameters.sender;
        }

        let recipients = null;
        if (
            emailActionParameters.recipientKeys &&
            emailActionParameters.recipientKeys.length
        ) {
            recipients = emailActionParameters.recipientKeys
                .map((key) => formValues[key])
                .join(",");
        }
        if (
            emailActionParameters.recipientList &&
            emailActionParameters.recipientList.length
        ) {
            recipients = emailActionParameters.recipientList.join(",");
        }
        let cc = null;
        if (
            emailActionParameters.ccKeys &&
            emailActionParameters.ccKeys.length
        ) {
            cc = emailActionParameters.ccKeys
                .map((key) => formValues[key])
                .join(",");
        }
        if (
            emailActionParameters.ccList &&
            emailActionParameters.ccList.length
        ) {
            cc = emailActionParameters.ccList.join(",");
        }
        let ccn = null;
        if (
            emailActionParameters.ccnKeys &&
            emailActionParameters.ccnKeys.length
        ) {
            ccn = emailActionParameters.ccnKeys
                .map((key) => formValues[key])
                .join(",");
        }
        if (
            emailActionParameters.ccnList &&
            emailActionParameters.ccnList.length
        ) {
            ccn = emailActionParameters.ccnList.join(",");
        }
        let body = null;
        if (
            emailActionParameters.bodyKeys &&
            emailActionParameters.bodyKeys.length
        ) {
            body = emailActionParameters.bodyKeys
                .filter(
                    (key) => formValues[key.key] && formValues[key.key].length,
                )
                .map((key) => `${key.label}${formValues[key.key]}`)
                .join("\n");
        }
        if (emailActionParameters.body && emailActionParameters.body.length) {
            body = emailActionParameters.body;
        }

        _this.sendEmail(
            {
                subject: subject,
                header: body,
                footer: null,
                company: _this.authService.getCurrentCompany(currentKeys),
                sender: sender,
                to: recipients,
                cc: cc,
                ccn: ccn,
            },
            emailActionParameters.outputEventWhenComplete,
            value,
        );
    }

    public sendEmail(data: any, outputEventWhenComplete: string, value: any) {
        const _this = this;

        if (data.templateKey) {
            _this.backendService.sendEmailUsingTemplate(data);
        } else {
            _this._dialogService.showLoadingDialog(
                "Sending Email",
                "Sending email. Please wait...",
            );
            const subscription = _this.backendService
                .sendEmail(
                    data.subject,
                    data.header,
                    data.footer,
                    data.company,
                    _this.authService.getLastLanguage(),
                    data.sender,
                    data.to,
                    data.cc,
                    data.ccn,
                )
                .subscribe(
                    (result) => {
                        _this._dialogService.closeDialog();
                        if (result.Success) {
                            _this._toastService.showSuccessToast(
                                "Email sent successfully!",
                            );
                            if (outputEventWhenComplete) {
                                _this.pubSubService.publishEvent(
                                    outputEventWhenComplete,
                                    value,
                                );
                            }
                        } else {
                            _this._toastService.showErrorToastWithReason(result.Error);
                        }
                        subscription.unsubscribe();
                    },
                    (error) => {
                        _this._dialogService.closeDialog();
                        _this._toastService.showErrorToastWithReason(error);
                        subscription.unsubscribe();
                    },
                );
        }
    }


}

