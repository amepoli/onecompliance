import { Component, OnInit } from "@angular/core";
import { UntypedFormGroup } from "@angular/forms";
import { FieldConfig } from "app/oc/interfaces";
import { FormsService } from "app/oc/services";
@Component({
    selector: "app-select",
    template: `
        <mat-form-field class="demo-full-width margin-top" [formGroup]="group">
            <mat-select
                [placeholder]="field | octranslate"
                [formControlName]="field.name"
                [ocTooltip]="field.tooltip"
                (selectionChange)="onSelectionChange($event)"
            >
                <mat-option *ngFor="let item of field.options" [value]="item">{{
                    item
                }}</mat-option>
            </mat-select>
        </mat-form-field>
    `,
    styles: [
        `
            :host ::ng-deep .mat-form-field-flex {
                background-color: aliceblue;
                border-radius: 8px;
            }
        `,
    ],
})
export class SelectComponent implements OnInit {
    field: FieldConfig;
    group: UntypedFormGroup;
    constructor(private _formsService: FormsService) {}
    ngOnInit() {}

    onSelectionChange(event: any) {
        const _this = this;
        _this._formsService.performAutoSave(_this.field);
    }
}
