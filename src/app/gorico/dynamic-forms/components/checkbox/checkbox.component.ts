import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FieldConfig } from '../../field.interface';
import { NgxPubSubService } from '@pscoped/ngx-pub-sub';

@Component({
  selector: 'app-checkbox',
  template: `
<div [ngStyle]="{'margin-right': '2%', 'margin-left': '2%', 'width': field.width+'%'}" *ngIf="field.isVisible != false" [formGroup]="group" >
<mat-checkbox [ngModel]="field.value" [formControlName]="field.name" [disabled]="field.readonly" (change)="onCheck($event)">{{field.label}}</mat-checkbox>
</div>
`,
  styles: []
})
export class CheckboxComponent implements OnInit {
  field: FieldConfig;
  group: FormGroup;
  constructor(private pubsubService: NgxPubSubService) {}
  ngOnInit() {

      const _this = this;

      if (typeof _this.field.value === 'string') {
          _this.field.value = parseInt(_this.field.value, 10);
      }
      if (_this.field.eventName !== null) {
        // wait a while before triggering the event
        setTimeout(() => {_this.pubsubService.publishEvent(_this.field.eventName, {origin: _this.field.name, index: _this.field.index, valueSet:_this.field.fullValueSet, data: _this.field.value, type:'checkbox'}); }, 50);
      }
    }

  onCheck(event: any) {
    const _this = this;
    if (_this.field.eventName !== null) {
        _this.pubsubService.publishEvent(_this.field.eventName, {origin: _this.field.name, index: _this.field.index, data: event.checked, type: 'checkbox'});
    }
  }
}
