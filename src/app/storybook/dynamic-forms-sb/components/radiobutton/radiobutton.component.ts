import { Component, OnInit } from "@angular/core";
import { UntypedFormGroup } from "@angular/forms";
import { FieldConfig } from '../../../../oc/interfaces';

@Component({
  selector: "app-radiobutton",
  template: `
<div [ngStyle]="{'width': '100%'}" *ngIf="field.isVisible != false" [formGroup]="group">
<label class="radio-label-padding">{{field | octranslatesb}}:</label>
<mat-radio-group [formControlName]="field.name" [ngStyle]="{'display': 'flex', 'flex-direction': 'column', 'align-items': 'flex-start'}" [(ngModel)]="chosenItem" [matTooltip]="field.tooltip">
  <mat-radio-button #button color="primary" *ngFor="let item of field.options" [value]="item" [disabled]="field.readonly || readOnlyPage" 
  (change)="onCheck($event)" 
  >
  <!-- INSIDE THE MAT-RADIO-BUTTON (click)="checkStates($event, button)" --> 
    {{item.name}}
  </mat-radio-button>
</mat-radio-group>
</div>
`,
  styles: [],
  host: {
    '[style.margin-right]': 'field.isVisible? "0.5%": "0"',
    '[style.margin-left]': 'field.isVisible? "0.5%": "0"',
    '[style.width]': 'field.isVisible? field.width + "%": "0"'
  }
})
export class RadiobuttonComponent implements OnInit {
  field: FieldConfig;
  group: UntypedFormGroup;
  readOnlyPage: boolean; // field.readonly overridden by page

  chosenItem: any;

  constructor() { }
  ngOnInit() {
    const _this = this;
    _this.chosenItem = _this.field?.options?.find(o => JSON.stringify(o.id) === JSON.stringify(_this.field.value));
  }

  onCheck(event: any): void {
  }

  /*
  checkStates(event: any, el): void {
    const _this = this;

    _this._console.log(event);
    _this._console.log(el);

    event.preventDefault();
    if (_this.chosenItem && _this.chosenItem === el.value) {
      el.checked = false;
      _this.chosenItem = null;
    } else {
      _this.chosenItem = el.value
      el.checked = true;
      _this.onCheck(event);
    }
  }
  */

  public reset() {
    this.chosenItem = null;
    this.field.value = null;
  }
}
