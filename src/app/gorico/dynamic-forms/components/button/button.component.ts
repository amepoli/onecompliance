import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FieldConfig } from '../../field.interface';
import { NgxPubSubService } from '@pscoped/ngx-pub-sub';
import { DialogService } from 'app/gorico/services/dialog.service';
import { BackendService } from 'app/gorico/views/backend/backend.service';
import { HttpClient } from '@angular/common/http';
import { AuthService } from 'app/gorico/login-page/auth.service';
@Component({
    selector: 'app-button',
    template: `
<div align="center" [ngStyle]="{'display': 'inline-block', 'width': '100%'}" *ngIf="field.isVisible != false" [formGroup]="group">
<button *ngIf="field.buttonIcon && !field.isDownloadButton" mat-icon-button [disabled]="field.readonly" (click)="onClickButton()">
        <mat-icon>{{field.buttonIcon}}</mat-icon>
</button>
<button *ngIf="field.isDownloadButton" mat-icon-button [disabled]="field.readonly" (click)="onClickButton()">
        <mat-icon>cloud_download</mat-icon>
</button>
<button *ngIf="!field.buttonIcon && !field.isDownloadButton" mat-raised-button color="primary" [disabled]="field.readonly" (click)="onClickButton()"
[style.width]="'100%'" [style.height.px]="'64'" [style.padding]="'16px'" [style.border-radius]="'4px'" [style.background-color]="field.style.background_color" [style.color]="field.style.font_color">
        {{field.label}}
</button>
</div>
`,
    styles: [],
    host: {
        '[style.padding-top.px]': 'field.isVisible && !field.buttonIcon && !field.isDownloadButton? "14": "0"',
        '[style.margin-right]': 'field.isVisible && !field.buttonIcon && !field.isDownloadButton? "1%": "8px"',
        '[style.margin-left]': 'field.isVisible && !field.buttonIcon && !field.isDownloadButton? "1%": "8px"',
        '[style.width]': 'field.isVisible && !field.buttonIcon && !field.isDownloadButton? field.width + "%": "32px"',
        '[style.height.px]': 'field.isVisible && !field.buttonIcon && !field.isDownloadButton? "96": "32"',
    }
})

export class ButtonComponent implements OnInit {
    field: FieldConfig;
    group: FormGroup;
    readOnlyPage: boolean;  // not used for button


    constructor(private pubsubService: NgxPubSubService,
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
            _this.backendService.getFileURL(null, _this.authService.getCurrentCompany(), {}, file_id).subscribe(
                url => {
                    if (url != null) {
                        _this.httpClient.get(url.url, { responseType: 'blob' }).subscribe(
                            fileData => {
                                saveAs(fileData, filename);
                            });
                    }
                });
        }
        // Confirm first if confirmation is true before performing action
        else if (_this.field.confirmButtonAction) {
            // Show confirmation dialog
            _this._dialogService.showConfimationDialog(_this.field.label ? _this.field.label : _this.field.name, 'Are you sure you want to perform this action?', 'Yes', 'No', 'info').then((result) => {
                if (result.value === true) {
                    // User clicked yes
                    if (_this.field.eventName !== null) {
                        _this.pubsubService.publishEvent(_this.field.eventName, { origin: _this.field.name, index: _this.field.index, valueSet: _this.field.fullValueSet, data: '', type: 'button_click' }); // provide index in case of multiple instances of the button
                    }
                }
            });
        }
        else {
            // Perform action without confirmation
            if (_this.field.eventName !== null) {
                _this.pubsubService.publishEvent(_this.field.eventName, { origin: _this.field.name, index: _this.field.index, valueSet: _this.field.fullValueSet, data: '', type: 'button_click' }); // provide index in case of multiple instances of the button
            }
        }

    }

    ngOnInit() {
        const _this = this;
        _this.field.style = _this.field.style == null ? { background_color: 'lightblue', font_color: 'black' } : _this.field.style;
        _this.field.style.background_color = _this.field.style.background_color != null ? _this.field.style.background_color : 'lightblue';
        _this.field.style.font_color = _this.field.style.font_color != null ? _this.field.style.font_color : 'black';
    }
}
