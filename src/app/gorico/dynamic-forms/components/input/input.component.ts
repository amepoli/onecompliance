import { Component, OnInit, AfterViewInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FieldConfig } from '../../field.interface';
import { NgxPubSubService } from '@pscoped/ngx-pub-sub';
@Component({
  selector: 'app-input',
  template: `
<mat-form-field *ngIf="field.isVisible != false" [ngStyle]="{'margin-right': '2%', 'margin-left': '2%','width': field.width+'%'}" appearance="outline" [formGroup]="group">
<mat-label>{{field.label}}</mat-label>
<input matInput [value]="field.value" [formControlName]="field.name" [placeholder]="field.label" [type]="field.inputType" [disabled]="field.readonly" 
    (blur)="onBlur()" (focus)="onFocus()"
    [style.background-color]="field.style.background_color" [style.color]="field.style.font_color">
<ng-container *ngFor="let validation of field.validations;" ngProjectAs="mat-error">
<mat-error *ngIf="group.get(field.name).hasError(validation.name)">{{validation.message}}</mat-error>
</ng-container>
</mat-form-field>
`,
  styles: []
})
export class InputComponent implements OnInit, AfterViewInit{
  field: FieldConfig;
  group: FormGroup;

  constructor(private pubsubService: NgxPubSubService) {}
  ngOnInit(): void {
    this.field.style = this.field.style == null ? {background_color: 'transparent', font_color : 'black'} : this.field.style;
    this.field.style.background_color = this.field.style.background_color != null  ? this.field.style.background_color : 'transparent';
    this.field.style.font_color = this.field.style.font_color != null ? this.field.style.font_color : 'black';
    if (this.field.eventName !== null && this.field.eventTrigger != null && this.field.eventTrigger === 'change') {
        this.group.get(this.field.name).valueChanges.subscribe(value => {
            this.pubsubService.publishEvent(this.field.eventName, {origin: this.field.name, index: this.field.index, data: value, type: 'change'});
        });
    }
  }

  ngAfterViewInit(): void {
    // publish a change event to start if expected
    if (this.field.eventName !== null && this.field.eventTrigger != null && this.field.eventTrigger === 'change') {
        setTimeout(() => {  // HACK !!! -> take some time to be sure all target elements are rendered 
            this.pubsubService.publishEvent(this.field.eventName, {origin: this.field.name, index: this.field.index, data: this.field.value, type: 'change'});
        }, 500);
    }
  }

  onBlur(): void {
    if (this.field.eventName !== null && this.field.eventTrigger != null && this.field.eventTrigger === 'blur') {
        this.pubsubService.publishEvent(this.field.eventName, {origin: this.field.name, index: this.field.index, data: this.field.value, type: 'blur'});
    }
  }

  onFocus(): void {
    if (this.field.eventName !== null && this.field.eventTrigger != null && this.field.eventTrigger === 'focus') {
        this.pubsubService.publishEvent(this.field.eventName, {origin: this.field.name, index: this.field.index, data: this.field.value, type: 'focus'});
    }
  }

}
