import { Component, OnInit, AfterViewInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FieldConfig } from '../../field.interface';
import { NgxPubSubService } from '@pscoped/ngx-pub-sub';
import { HelperService } from 'app/gorico/services/helper.service';
import { Moment } from 'moment';
import { ValidationsService } from 'app/gorico/services/validations.service';
@Component({
  selector: 'app-input',
  template: `
<mat-form-field *ngIf="field.isVisible != false" [ngStyle]="{'width': '100%'}" appearance="outline" [formGroup]="group">
<mat-label>{{field.label}}</mat-label>
<input [required]="isRequired" *ngIf="field.inputType !== 'date'" matInput [value]="field.value" [formControlName]="field.name" [placeholder]="field.label" [type]="field.inputType" [readonly]="field.readonly || readOnlyPage" 
    (blur)="onBlur()" (focus)="onFocus()" (change)="updateValue()"
    [style.padding]="'4px'" [style.border-radius]="'4px'" [style.background-color]="field.style.background_color" [style.color]="field.style.font_color">
    
<input [required]="isRequired" *ngIf="field.inputType === 'date'" matInput [matDatepicker]="picker" [value]="field.value" [placeholder]="field.label" [formControlName]="field.name" [disabled]="field.readonly || readOnlyPage" 
    (blur)="onBlur()" (focus)="onFocus()" (dateChange)="updateValue()"
    [style.padding]="'4px'" [style.border-radius]="'4px'" [style.background-color]="field.style.background_color" [style.color]="field.style.font_color">
<mat-datepicker-toggle *ngIf="field.inputType === 'date'" matSuffix [for]="picker"></mat-datepicker-toggle>
<mat-datepicker #picker></mat-datepicker>

<ng-container *ngFor="let validation of field.validations;" ngProjectAs="mat-error">
<mat-error *ngIf="group.get(field.name).hasError(validation.name)">{{validation.message}}</mat-error>
</ng-container>
</mat-form-field>
`,
  styles: [],
  host: {
    '[style.padding-top.px]': 'field.isVisible? "10": "0"',
    '[style.margin-right]': 'field.isVisible? "1%": "0"',
    '[style.margin-left]': 'field.isVisible? "1%": "0"',
    '[style.width]': 'field.isVisible? field.width + "%": "0"',
    '[style.height.px]': 'field.isVisible? "96": "0"',
  }
})
export class InputComponent implements OnInit, AfterViewInit {
  field: FieldConfig;
  group: FormGroup;
  readOnlyPage: boolean; // field.readonly overridden by page
  isRequired = false; // field is required or not

  constructor(private pubsubService: NgxPubSubService) { }
  ngOnInit(): void {
    const _this = this;
    _this.field.style = _this.field.style == null ? { background_color: 'transparent', font_color: 'black' } : _this.field.style;
    _this.field.style.background_color = _this.field.style.background_color != null ? _this.field.style.background_color : 'transparent';
    _this.field.style.font_color = _this.field.style.font_color != null ? _this.field.style.font_color : 'black';
    if (_this.field.eventName !== null && _this.field.eventTrigger != null && _this.field.eventTrigger === 'change') {
      _this.group.get(_this.field.name).valueChanges.subscribe(value => {
        _this.pubsubService.publishEvent(_this.field.eventName, { origin: _this.field.name, index: _this.field.index, valueSet: _this.field.fullValueSet, data: value, type: 'change' });
      });
    }
    if (_this.field.eventName !== null && _this.field.eventTrigger != null && _this.field.eventTrigger === 'blur') {
      setTimeout(() => _this.pubsubService.publishEvent(_this.field.eventName, { origin: _this.field.name, index: _this.field.index, valueSet: _this.field.fullValueSet, data: _this.field.value, type: 'blur' }), 50);
    }

    // Format the field value if needed
    _this.formatValue();

    // Check if required
    if (_this.field.validations) {
      _this.isRequired = ValidationsService.checkIfRequired(_this.field.validations);
    }

    if (_this.field.validations && _this.field.validations.length) {
      console.log('validations', _this.field.validations);
    }
  }

  ngAfterViewInit(): void {
    const _this = this;
    // publish a change event to start if expected
    if (_this.field.eventName !== null && _this.field.eventTrigger != null && _this.field.eventTrigger === 'change') {
      setTimeout(() => {  // HACK !!! -> take some time to be sure all target elements are rendered 
        _this.pubsubService.publishEvent(_this.field.eventName, { origin: _this.field.name, index: _this.field.index, data: _this.field.value, type: 'change' });
      }, 500);
    }
  }

  onBlur(): void {
    const _this = this;
    if (_this.field.eventName !== null && _this.field.eventTrigger != null && _this.field.eventTrigger === 'blur') {
      _this.pubsubService.publishEvent(_this.field.eventName, { origin: _this.field.name, index: _this.field.index, data: _this.field.value, type: 'blur' });
    }
  }

  onFocus(): void {
    const _this = this;
    if (_this.field.eventName !== null && _this.field.eventTrigger != null && _this.field.eventTrigger === 'focus') {
      _this.pubsubService.publishEvent(_this.field.eventName, { origin: _this.field.name, index: _this.field.index, data: _this.field.value, type: 'focus' });
    }
  }

  updateValue() {
    const _this = this;

    // Extra work needed to convert date type input
    if (_this.field.inputType === 'date') {
      let dateValue: any = _this.group.get(_this.field.name).value;

      // Check if date in Moment type
      if (dateValue != null && typeof dateValue === 'object') {
        // Convert Moment to string
        _this.field.value = HelperService.getFormattedDate(dateValue.toDate());
        _this.group.get(_this.field.name).setValue(_this.field.value);
      }
      else {
        // Copy as it is
        _this.field.value = _this.group.get(_this.field.name).value;
      }
    }
    else {
      // Copy as it is
      _this.field.value = _this.group.get(_this.field.name).value;
    }
  }

  formatValue() {
    let _this = this;
    if (_this.field.inputType === 'date') {
      // Replace all found markers
      let newString = HelperService.getFormattedString(_this.field.value);

      // If something was found, update values
      if (newString !== _this.field.value) {
        // Replace the field and form control value
        _this.field.value = newString;
        _this.group.get(_this.field.name).setValue(_this.field.value);

        // If Event publish is required on startup
        // _this.pubsubService.publishEvent(_this.field.eventName, { origin: _this.field.name, index: _this.field.index, valueSet: _this.field.fullValueSet, data: _this.field.value, type: 'change' });
      }
    }
  }
}
