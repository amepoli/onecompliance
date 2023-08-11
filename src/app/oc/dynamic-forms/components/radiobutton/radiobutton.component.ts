import { Component, OnInit } from "@angular/core";
import { UntypedFormGroup } from "@angular/forms";
import { FieldConfig } from 'app/oc/interfaces';
import { ConsoleLoggerService, PubSubService } from "app/oc/services";

@Component({
  selector: "app-radiobutton",
  template: `
<div [ngStyle]="{'width': '100%'}" *ngIf="field.isVisible != false" [formGroup]="group">
<label class="radio-label-padding">{{field | octranslate}}:</label>
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
    '[style.margin-right]': 'field.isVisible? "1%": "0"',
    '[style.margin-left]': 'field.isVisible? "1%": "0"',
    '[style.width]': 'field.isVisible? field.width + "%": "0"'
  }
})
export class RadiobuttonComponent implements OnInit {
  field: FieldConfig;
  group: UntypedFormGroup;
  readOnlyPage: boolean; // field.readonly overridden by page

  chosenItem: any;

  constructor(private pubSubService: PubSubService,
    private _console: ConsoleLoggerService) { }
  ngOnInit() {
    const _this = this;
    _this._console.log(_this.field);
    _this.chosenItem = _this.field.options.find(o => JSON.stringify(o.id) === JSON.stringify(_this.field.value));
    // trigger an event the first time 
    setTimeout(() => { _this.pubSubService.publishEvent(_this.field.eventName, { origin: _this.field.name, index: _this.field.index, valueSet: _this.field.fullValueSet, data: _this.field.value, type: 'radiobutton' }); }, 50);
  }

  onCheck(event: any): void {
    const _this = this;

    _this._console.log(event);
    _this._console.log(_this.field.eventName);

    if (_this.field.eventName !== null) {
      // wait a while before triggering the event
      setTimeout(() => { _this.pubSubService.publishEvent(_this.field.eventName, { origin: _this.field.name, index: _this.field.index, valueSet: _this.field.fullValueSet, data: event.value.id, type: 'radiobutton' }); }, 50);
    }
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
}
