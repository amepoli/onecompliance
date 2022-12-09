import { Component, OnInit, Output, EventEmitter, OnDestroy } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { FieldConfig } from 'app/oc/interfaces';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { AuthService, BackendService, DialogService, PubSubService } from 'app/oc/services';
@Component({
    selector: 'app-button',
    template: `
<div align="center" [ngStyle]="{'display': 'inline-block', 'width': '100%'}" *ngIf="field.isVisible != false" [formGroup]="group">
<button *ngIf="field.buttonIcon && !field.label && !field.isDownloadButton" mat-icon-button [disabled]="field.readonly" (click)="onClickButton()" [matTooltip]="field.tooltip">
        <mat-icon>{{field.buttonIcon}}</mat-icon>
</button>
<button mat-raised-button *ngIf="field.buttonIcon && field.label && !field.isDownloadButton" color="primary" [disabled]="field.readonly" (click)="onClickButton()"
[style.width]="'100%'" [style.background-color]="field.style.background_color" [style.color]="field.style.font_color" [matTooltip]="field.tooltip">
        <mat-icon>{{field.buttonIcon}}</mat-icon>{{field.label}}
</button>
<button *ngIf="field.isDownloadButton" mat-icon-button [disabled]="field.readonly" (click)="onClickButton()" [matTooltip]="field.tooltip">
        <mat-icon>cloud_download</mat-icon>
</button>
<button *ngIf="!field.buttonIcon && !field.isDownloadButton" mat-raised-button color="primary" [disabled]="field.readonly" (click)="onClickButton()"
[style.width]="'100%'" [style.height.px]="'64'" [style.padding]="'16px'" [style.border-radius]="'4px'" [style.background-color]="field.style.background_color" [style.color]="field.style.font_color" [matTooltip]="field.tooltip">
        {{field.label}}
</button>
</div>
`,
    styles: [],
    host: {
        '[style.padding-top.px]': 'field.isVisible? field.buttonIcon || field.isDownloadButton? "24": "14": "0"',
        '[style.margin-right]': 'field.isVisible?(field.buttonIcon && !field.label) || field.isDownloadButton? "8px": "1%": "0"',
        '[style.margin-left]': 'field.isVisible? (field.buttonIcon && !field.label) || field.isDownloadButton? "8px": "1%": "0"',
        '[style.width]': 'field.isVisible? (field.buttonIcon && !field.label) || field.isDownloadButton? "32px": field.width + "%": "0"',
        '[style.height.px]': 'field.isVisible? (field.buttonIcon && !field.label) || field.isDownloadButton? "32": field.buttonIcon? "64": "96": "0"',
        // I want to use this in the future :p
        // '[style.display]': 'field.isVisible? "unset": "none"'
    }
})

export class ButtonComponent implements OnInit, OnDestroy {
    field: FieldConfig;
    group: UntypedFormGroup;
    readOnlyPage: boolean;  // not used for button

    subscriptions: Subscription[] = [];


    constructor(private pubSubService: PubSubService,
        private _dialogService: DialogService,
        private backendService: BackendService,
        private authService: AuthService,
        private httpClient: HttpClient) { }

    onClickButton() {
        const _this = this;

        // check first if it is a download button
        if (_this.field.isDownloadButton && _this.field.value != null) {
            // button value must be file_id^filename 
            const keys = _this.field.value.split('^');
            const file_id = keys[0];
            const filename = keys[1];
            const subscription = _this.backendService.getFileURL(null, _this.authService.getCurrentCompany(_this.field.fullValueSet), {}, file_id).subscribe(
                url => {
                    if (url != null) {
                        _this.subscriptions.push(_this.httpClient.get(url.url, { responseType: 'blob' }).subscribe(
                            fileData => {
                                saveAs(fileData, filename);
                            }));
                    }
                });
            _this.subscriptions.push(subscription);
        }
        // Confirm first if confirmation is true before performing action
        else if (_this.field.confirmButtonAction) {
            // Show confirmation dialog
            _this._dialogService.showConfimationDialog(_this.field.label ? _this.field.label : _this.field.name, 'Are you sure you want to perform this action?', 'Yes', 'No', 'info').then((result) => {
                if (result.value === true) {
                    // User clicked yes
                    if (_this.field.eventName !== null) {
                        _this.pubSubService.publishEvent(_this.field.eventName, { showEventProcessing: true, origin: _this.field.name, index: _this.field.index, valueSet: _this.field.fullValueSet, data: '', type: 'button_click' }); // provide index in case of multiple instances of the button
                    }
                }
            });
        }
        else {
            // Perform action without confirmation
            if (_this.field.eventName !== null) {
                _this.pubSubService.publishEvent(_this.field.eventName, { showEventProcessing: true, origin: _this.field.name, index: _this.field.index, valueSet: _this.field.fullValueSet, data: '', type: 'button_click' }); // provide index in case of multiple instances of the button
            }
        }

    }

    ngOnInit() {
        const _this = this;
        _this.field.style = _this.field.style == null ? { background_color: '#2A4F9D', font_color: 'white' } : _this.field.style;
        _this.field.style.background_color = _this.field.style.background_color != null ? _this.field.style.background_color : '#2A4F9D';
        _this.field.style.font_color = _this.field.style.font_color != null ? _this.field.style.font_color : 'white';
    }

    ngOnDestroy() {
        this.subscriptions.forEach(element => {
            element.unsubscribe();
        });
    }
}
