import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FieldConfig } from '../../field.interface';
import { NgxPubSubService } from '@pscoped/ngx-pub-sub';
@Component({
  selector: 'app-input',
  template: `
<mat-form-field *ngIf="field.isVisible != false" [ngStyle]="{'margin-right': '5%', 'margin-left': '5%','width': field.width+'%'}" appearance="outline" [formGroup]="group">
<mat-label>{{field.label}}</mat-label>
<input matInput [value]="field.value" [formControlName]="field.name" [placeholder]="field.label" [type]="field.inputType" [readonly]="field.readonly" (blur)="onBlur()" (focus)="onFocus()">
<ng-container *ngFor="let validation of field.validations;" ngProjectAs="mat-error">
<mat-error *ngIf="group.get(field.name).hasError(validation.name)">{{validation.message}}</mat-error>
</ng-container>
</mat-form-field>
`,
  styles: []
})
export class InputComponent implements OnInit {
  field: FieldConfig;
  group: FormGroup;
  constructor(private pubsubService: NgxPubSubService) {}
  ngOnInit() {}

  onBlur(): void {
    if (this.field.eventName !== null && this.field.eventTrigger != null && this.field.eventTrigger === 'blur') {
        this.pubsubService.publishEvent(this.field.eventName, {origin: this.field.name, index: this.field.index, data: this.field.value});
    }
  }

  onFocus(): void {
    if (this.field.eventName !== null && this.field.eventTrigger != null && this.field.eventTrigger === 'focus') {
        this.pubsubService.publishEvent(this.field.eventName, {origin: this.field.name, index: this.field.index, data: this.field.value});
    }
  }
}
