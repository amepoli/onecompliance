import { Component, OnInit, Output, EventEmitter, OnDestroy } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { FieldConfig } from 'app/oc/interfaces';
import { Subscription } from 'rxjs';
@Component({
    selector: 'app-button',
    template: `
<div align="center" [ngStyle]="{'display': 'inline-block', 'width': '100%'}" *ngIf="field.isVisible != false" [formGroup]="group">
<button *ngIf="field.buttonIcon && !field.label && !field.isDownloadButton" mat-icon-button [disabled]="field.readonly" (click)="onClickButton()" [matTooltip]="field.tooltip">
        <mat-icon>{{field.buttonIcon}}</mat-icon>
</button>
<button mat-raised-button *ngIf="field.buttonIcon && field.label && !field.isDownloadButton" color="primary" [disabled]="field.readonly" (click)="onClickButton()"
[style.width]="'100%'" [style.background-color]="field.style.background_color" [style.color]="field.style.font_color" [matTooltip]="field.tooltip">
        <mat-icon>{{field.buttonIcon}}</mat-icon>{{field | octranslatesb}}
</button>
<button *ngIf="field.isDownloadButton" mat-icon-button [disabled]="field.readonly" (click)="onClickButton()" [matTooltip]="field.tooltip">
        <mat-icon>cloud_download</mat-icon>
</button>
<button *ngIf="!field.buttonIcon && !field.isDownloadButton" mat-raised-button color="primary" [disabled]="field.readonly" (click)="onClickButton()"
[style.width]="'100%'" [style.height.px]="'64'" [style.padding]="'16px'" [style.border-radius]="'4px'" [style.background-color]="field.style.background_color" [style.color]="field.style.font_color" [matTooltip]="field.tooltip">
        {{field | octranslatesb}}
</button>
</div>
`,
    styles: [`
        :host ::ng-deep .mat-form-field-wrapper {
            padding-bottom: 2px !important;
        }
    `],
    host: {
        '[style.padding-top.px]': 'field.isVisible? field.buttonIcon || field.isDownloadButton? "8": "13": "0"',
        // '[style.padding-bottom.px]': 'field.isVisible? field.buttonIcon || field.isDownloadButton? "24": "14": "0"',
        '[style.margin-right]': 'field.isVisible?(field.buttonIcon && !field.label) || field.isDownloadButton? "8px": "0.5%": "0"',
        '[style.margin-left]': 'field.isVisible? (field.buttonIcon && !field.label) || field.isDownloadButton? "8px": "0.5%": "0"',
        '[style.width]': 'field.isVisible? (field.buttonIcon && !field.label) || field.isDownloadButton? "32px": field.width + "%": "0"',
        '[style.height.px]': 'field.isVisible? (field.buttonIcon && !field.label) || field.isDownloadButton? "32": field.buttonIcon? "64": "76": "0"',
        
        // Adding margin because there is no padding anymore
        '[style.margin-top.px]': 'field.isVisible? field.buttonIcon || field.isDownloadButton? "8": "8": "0"',
        '[style.margin-bottom.px]': 'field.isVisible? field.buttonIcon || field.isDownloadButton? "8": "8": "0"',
    
        // I want to use this in the future :p
        // '[style.display]': 'field.isVisible? "unset": "none"'
    }
})

export class ButtonComponent implements OnInit, OnDestroy {
    field: FieldConfig;
    group: UntypedFormGroup;
    readOnlyPage: boolean;  // not used for button

    constructor() { }

    onClickButton() {
    }

    ngOnInit() {
        const _this = this;
        _this.field.style = _this.field.style == null ? { background_color: '#2A4F9D', font_color: 'white' } : _this.field.style;
        _this.field.style.background_color = _this.field.style.background_color != null ? _this.field.style.background_color : '#2A4F9D';
        _this.field.style.font_color = _this.field.style.font_color != null ? _this.field.style.font_color : 'white';
    }

    ngOnDestroy() {
        
    }
}
