import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FieldConfig } from '../../field.interface';
import { NgxPubSubService } from '@pscoped/ngx-pub-sub';

@Component({
  selector: 'app-checkbox',
  template: `
<span [formGroup]="group" >
  <mat-checkbox *ngIf="field.isVisible != false" [ngStyle]="{'width': '100%'}" [ngModel]="field.value" [formControlName]="field.name" [disabled]="field.readonly || readOnlyPage" (change)="onCheck($event)">{{field.label}}</mat-checkbox>
</span>`,
  styles: [],
  host: {
    '[style.padding-top.px]': 'field.isVisible? "8": "0"',
    '[style.margin-right]': 'field.isVisible? "1%": "0"',
    '[style.margin-left]': 'field.isVisible? "1%": "0"',
    '[style.width]': 'field.isVisible? field.width + "%": "0"',
    '[style.height.px]': 'field.isVisible? "48": "0"',
  }
})
export class CheckboxComponent implements OnInit {
  field: FieldConfig;
  group: FormGroup;
  readOnlyPage: boolean; // field.readonly overridden by page

  constructor(private pubsubService: NgxPubSubService) { }
  ngOnInit() {

    const _this = this;

    if (typeof _this.field.value === 'string') {
      _this.field.value = parseInt(_this.field.value, 10);
    }
    if (_this.field.isVisible && _this.field.eventName !== null && _this.field.eventTrigger === 'change') {
      if (!_this.field.conditionalQuery) {
        // No condition required, wait a while before triggering the event
        setTimeout(() => { _this.pubsubService.publishEvent(_this.field.eventName, { origin: _this.field.name, index: _this.field.index, valueSet: _this.field.fullValueSet, data: _this.field.value, type: 'change' }); }, 50);
      }
    }
  }

  onCheck(event: any) {
    const _this = this;
    if (_this.field.isVisible && _this.field.eventName !== null) {
      if (!_this.field.conditionalQuery) {
        // No condition required, wait a while before triggering the event
        _this.pubsubService.publishEvent(_this.field.eventName, { origin: _this.field.name, index: _this.field.index, data: event.checked ? '1' : '0', type: _this.field.eventTrigger });
      }
      else {
        // First need to run a query
        // Query here
        // wait a while before triggering the event
        _this.pubsubService.publishEvent(_this.field.eventName, { origin: _this.field.name, index: _this.field.index, data: event.checked ? '1' : '0', type: _this.field.eventTrigger });
      }

    }
  }
}
