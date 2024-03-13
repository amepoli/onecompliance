import { Component, OnInit } from "@angular/core";
import { UntypedFormGroup } from "@angular/forms";
import { FieldConfig } from 'app/oc/interfaces';
@Component({
  selector: "app-date",
  template: `
<mat-form-field [ngStyle]="{'width': '100%'}" *ngIf="field.isVisible != false" [formGroup]="group">
<input matInput [matDatepicker]="picker" [formControlName]="field.name" [placeholder]="field | octranslate" [readonly]="field.readonly || readOnlyPage" [matTooltip]="field.tooltip">
<mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
<mat-datepicker #picker></mat-datepicker>
<mat-hint></mat-hint>
<ng-container *ngFor="let validation of field.validations;" ngProjectAs="mat-error">
<mat-error *ngIf="group.get(field.name).hasError(validation.name)">{{validation | octranslate}}</mat-error>
</ng-container>
</mat-form-field>
`,
  styles: [`
    :host ::ng-deep .mat-form-field-flex {
      background-color: aliceblue;
      border-radius: 8px;
    }
    :host ::ng-deep .mat-form-field-wrapper {
      padding-bottom: 2px !important;
    }
  `],
  host: {
    '[style.margin-right]': 'field.isVisible? "0.5%": "0"',
    '[style.margin-left]': 'field.isVisible? "0.5%": "0"',
    '[style.width]': 'field.isVisible? field.width + "%": "0"'
  }
})
export class DateComponent implements OnInit {
  field: FieldConfig;
  group: UntypedFormGroup;
  readOnlyPage: boolean; // field.readonly overridden by page
  constructor() { }
  ngOnInit() { }
}
