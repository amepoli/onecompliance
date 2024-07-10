import { Component, OnInit } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { FieldConfig } from '../../../../oc/interfaces';

@Component({
  selector: 'app-checkbox',
  template: `
<span [formGroup]="group" >
  <mat-checkbox color="primary" *ngIf="field.isVisible != false" [ngStyle]="{'width': '100%'}" [ngModel]="field.value" [formControlName]="field.name" [disabled]="field.readonly || readOnlyPage" (change)="onCheck($event)" [matTooltip]="field.tooltip">{{field | octranslatesb}}</mat-checkbox>
</span>`,
  styles: [`
    :host ::ng-deep .mat-form-field-wrapper {
      padding-bottom: 2px !important;
    }
  `],
  host: {
    // '[style.padding-top.px]': 'field.isVisible? "20": "0"',
    // '[style.padding-bottom.px]': 'field.isVisible? "20": "0"',
    '[style.margin-right]': 'field.isVisible? "0.5%": "0"',
    '[style.margin-left]': 'field.isVisible? "0.5%": "0"',
    '[style.width]': 'field.isVisible? field.width + "%": "0"',
    '[style.height.px]': 'field.isVisible? "100%": "0"',
  }
})
export class CheckboxComponent implements OnInit {
  field: FieldConfig;
  group: UntypedFormGroup;
  readOnlyPage: boolean; // field.readonly overridden by page

  constructor() { }
  ngOnInit() {

    const _this = this;

    if (typeof _this.field.value === 'string') {
      _this.field.value = parseInt(_this.field.value, 10);
    }
  }

  onCheck(event: any) {
    const _this = this;
  }
}
