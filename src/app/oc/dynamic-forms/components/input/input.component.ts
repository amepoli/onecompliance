import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FieldConfig } from 'app/oc/interfaces';
import { ConsoleLoggerService, DialogService, HelperService, PubSubService, ValidationsService } from 'app/oc/services';
import { TimezoneService } from 'app/oc/services/timezone.service';
import * as moment from 'moment';
import { Moment } from 'moment';
import { Subscription } from 'rxjs';
@Component({
  selector: 'app-input',
  template: `
  <!-- <mat-form-field [ngClass]="(!field.eventTrigger && field.readonly) ? 'readOnly': ''" *ngIf="field.readonly == true && field.isVisible != false && field.inputType !== 'date' && field.inputType !== 'datetime' && field.inputType !== 'time'" [ngStyle]="{'width': '100%'}" appearance="outline" [formGroup]="group">
  <mat-label>{{field.label}}</mat-label>
  <span *ngIf="field.prefix" matPrefix>{{field.prefix}}</span>
  <input [required]="isRequired" matInput [value]="field.value" [formControlName]="field.name" [placeholder]="field.label" [type]="field.inputType" [readonly]="field.readonly || readOnlyPage" 
    (blur)="onBlur()" (focus)="onFocus()" (change)="updateValue()"
    [style.padding]="'4px'" [style.border-radius]="'4px'" [style.background-color]="field.style.background_color" [style.color]="field.style.font_color">
  <span *ngIf="field.suffix" matSuffix>{{field.suffix}}</span>
  <ng-container *ngFor="let validation of field.validations;" ngProjectAs="mat-error">
    <mat-error *ngIf="group.get(field.name).hasError(validation.name)">{{validation.message}}</mat-error>
  </ng-container>
</mat-form-field> -->

  <mat-form-field [ngClass]="field.eventTrigger === 'press'  && (field.readonly || readOnlyPage)? 'readOnlyPressable': ''" (click)="onPress()" *ngIf="field.isVisible != false && field.inputType !== 'date' && field.inputType !== 'datetime' && field.inputType !== 'time'" [ngStyle]="{'width': '100%'}" appearance="outline" [formGroup]="group">
  <mat-label>{{field.label}}</mat-label>
  <span *ngIf="field.prefix" matPrefix>{{field.prefix}}</span>
  <input [required]="isRequired" matInput [value]="field.value" [formControlName]="field.name" [placeholder]="field.label" [type]="field.inputType" [readonly]="field.readonly || readOnlyPage" 
    (blur)="onBlur()" (focus)="onFocus()" (change)="updateValue()"
    [style.padding]="'4px'" [style.border-radius]="'4px'" [style.background-color]="field.style.background_color" [style.color]="field.style.font_color">
  <span *ngIf="field.suffix" matSuffix>{{field.suffix}}</span>
  <ng-container *ngFor="let validation of field.validations;" ngProjectAs="mat-error">
    <mat-error *ngIf="group.get(field.name).hasError(validation.name)">{{validation.message}}</mat-error>
  </ng-container>
</mat-form-field>

<mat-form-field [ngClass]="field.eventTrigger === 'press' && (field.readonly || readOnlyPage)? 'readOnlyPressable': ''" (click)="onPress()" *ngIf="field.isVisible != false && field.inputType === 'date'" [ngStyle]="{'width': '100%'}" appearance="outline" [formGroup]="group">
  <mat-label>{{field.label}}</mat-label>
  <span *ngIf="field.prefix" matPrefix>{{field.prefix}}</span>

  <input [required]="isRequired" matInput [matDatepicker]="datepicker" [value]="field.value" [placeholder]="field.label" [formControlName]="field.name" [disabled]="field.readonly || readOnlyPage" 
    (blur)="onBlur()" (focus)="onFocus()" (dateChange)="updateValue()"
    [style.padding]="'4px'" [style.border-radius]="'4px'" [style.background-color]="field.style.background_color" [style.color]="field.style.font_color">
  <mat-datepicker-toggle matSuffix [for]="datepicker"></mat-datepicker-toggle>
  <mat-datepicker matInput [matDatepicker]="datepicker" #datepicker></mat-datepicker>

  <span *ngIf="field.suffix" matSuffix>{{field.suffix}}</span>
  <ng-container *ngFor="let validation of field.validations;" ngProjectAs="mat-error">
    <mat-error *ngIf="group.get(field.name).hasError(validation.name)">{{validation.message}}</mat-error>
  </ng-container>
</mat-form-field>

<mat-form-field [ngClass]="field.eventTrigger === 'press' && (field.readonly || readOnlyPage)? 'readOnlyPressable': ''" (click)="onPress()" *ngIf="field.isVisible != false && (field.inputType === 'datetime')" [ngStyle]="{'width': '100%'}" appearance="outline" [formGroup]="group">
  <mat-label>{{field.label}}</mat-label>
  <span *ngIf="field.prefix" matPrefix>{{field.prefix}}</span>

  <input [required]="isRequired" matInput [ngxMatDatetimePicker]="datetimepicker" [placeholder]="field.label" [formControlName]="field.name" [disabled]="field.readonly || readOnlyPage" 
    (blur)="onBlur()" (focus)="onFocus()" (dateChange)="updateValue()"
    [style.padding]="'4px'" [style.border-radius]="'4px'" [style.background-color]="field.style.background_color" [style.color]="field.style.font_color">
   <mat-datepicker-toggle matSuffix [for]="datetimepicker"></mat-datepicker-toggle>
   <ngx-mat-datetime-picker #datetimepicker [showSpinners]="true" [showSeconds]="true"
      [stepHour]="true" [stepMinute]="true" [stepSecond]="true"
      [touchUi]="false" [enableMeridian]="true"
      [disableMinute]="false" [hideTime]="false">
   </ngx-mat-datetime-picker>

  <span *ngIf="field.suffix" matSuffix>{{field.suffix}}</span>
  <ng-container *ngFor="let validation of field.validations;" ngProjectAs="mat-error">
    <mat-error *ngIf="group.get(field.name).hasError(validation.name)">{{validation.message}}</mat-error>
  </ng-container>
</mat-form-field>

<mat-form-field [ngClass]="field.eventTrigger === 'press' && (field.readonly || readOnlyPage)? 'readOnlyPressable': ''" (click)="onPress()" *ngIf="field.isVisible != false && (field.inputType === 'time')" [ngStyle]="{'width': '100%'}" appearance="outline" [formGroup]="group">
  <mat-label>{{field.label}}</mat-label>
  <span *ngIf="field.prefix" matPrefix>{{field.prefix}}</span>

  <input [required]="isRequired" matInput [ngxMatTimePicker]="timepicker" [placeholder]="field.label" [formControlName]="field.name" [disabled]="field.readonly || readOnlyPage" 
    (blur)="onBlur()" (focus)="onFocus()" (dateChange)="updateValue()"
    [style.padding]="'4px'" [style.border-radius]="'4px'" [style.background-color]="field.style.background_color" [style.color]="field.style.font_color">
  <mat-datepicker-toggle matSuffix [for]="timepicker"></mat-datepicker-toggle>
  <ngx-mat-timepicker [required]="isRequired" [placeholder]="field.label" [formControlName]="field.name" [disabled]="field.readonly || readOnlyPage" 
    (blur)="onBlur()" (focus)="onFocus()" (timeChange)="updateValue()"
    [style.padding]="'4px'" [style.border-radius]="'4px'" [style.background-color]="field.style.background_color" [style.color]="field.style.font_color">
  </ngx-mat-timepicker>

  <span *ngIf="field.suffix" matSuffix>{{field.suffix}}</span>
  <ng-container *ngFor="let validation of field.validations;" ngProjectAs="mat-error">
    <mat-error *ngIf="group.get(field.name).hasError(validation.name)">{{validation.message}}</mat-error>
  </ng-container>
</mat-form-field>


`,
  styles: [`
    :host ::ng-deep .mat-form-field-wrapper .mat-form-field-flex {
      background-color: aliceblue;
      border-radius: 8px;
    }
    
    :host ::ng-deep .readOnlyPressable .mat-form-field-wrapper .mat-form-field-flex {
      background-color: transparent !important;
      border-radius: 8px;
    }

    :host ::ng-deep .readOnlyPressable .mat-form-field-wrapper .mat-form-field-flex .mat-form-field-outline .mat-form-field-outline-start {
      border: none !important;
    }

    :host ::ng-deep .readOnlyPressable .mat-form-field-wrapper .mat-form-field-flex .mat-form-field-outline .mat-form-field-outline-gap {
      border: none !important;
    }

    :host ::ng-deep .readOnlyPressable .mat-form-field-wrapper .mat-form-field-flex .mat-form-field-outline .mat-form-field-outline-end {
      border: none !important;
    }

    :host ::ng-deep .readOnlyPressable .mat-form-field-wrapper .mat-form-field-flex .mat-form-field-infix input {
      color: #2196f3 !important;
      cursor: pointer;
      font-weight: 500 !important;
      text-decoration: underline;
    }

    :host ::ng-deep .readOnly .mat-form-field-wrapper .mat-form-field-flex .mat-form-field-infix input-ro {
      color: black !important;
      font-weight: bold !important;
    }

  `],
  host: {
    '[style.padding-top.px]': 'field.isVisible? "10": "0"',
    '[style.margin-right]': 'field.isVisible? "1%": "0"',
    '[style.margin-left]': 'field.isVisible? "1%": "0"',
    '[style.width]': 'field.isVisible? field.width + "%": "0"',
    '[style.height.px]': 'field.isVisible? "96": "0"',
  }
})
export class InputComponent implements OnInit, AfterViewInit, OnDestroy {
  field: FieldConfig;
  group: FormGroup;
  readOnlyPage: boolean; // field.readonly overridden by page
  isRequired = false; // field is required or not

  subscription: Subscription;

  // For future use
  // @HostBinding('style.margin-right') marginRight = '1%';

  constructor(private timezoneService: TimezoneService,
              private pubSubService: PubSubService,
              private _console: ConsoleLoggerService,
              private _dialogService: DialogService) { }
  ngOnInit(): void {
    const _this = this;
    _this.field.style = _this.field.style == null ? { background_color: 'transparent', font_color: 'black' } : _this.field.style;
    _this.field.style.background_color = _this.field.style.background_color != null ? _this.field.style.background_color : 'transparent';
    _this.field.style.font_color = _this.field.style.font_color != null ? _this.field.style.font_color : 'black';
    if (_this.field.eventName !== null && _this.field.eventTrigger != null && _this.field.eventTrigger === 'change') {
      _this.subscription = _this.group.get(_this.field.name).valueChanges.subscribe(value => {
        _this.pubSubService.publishEvent(_this.field.eventName, { origin: _this.field.name, index: _this.field.index, valueSet: _this.field.fullValueSet, data: value, type: 'change' });
      });
    }
    if (_this.field.eventName !== null && _this.field.eventTrigger != null && _this.field.eventTrigger === 'blur') {
      setTimeout(() => _this.pubSubService.publishEvent(_this.field.eventName, { origin: _this.field.name, index: _this.field.index, valueSet: _this.field.fullValueSet, data: _this.field.value, type: 'blur' }), 50);
    }

    // Format the field value if needed
    _this.formatValue();

    // Check if required
    if (_this.field.validations) {
      _this.isRequired = ValidationsService.checkIfRequired(_this.field.validations);
    }

    if (_this.field.validations && _this.field.validations.length) {
      _this._console.log('validations', _this.field.validations);
    }
  }

  ngAfterViewInit(): void {
    const _this = this;
    // publish a change event to start if expected
    if (_this.field.eventName !== null && _this.field.eventTrigger != null && _this.field.eventTrigger === 'change') {
      setTimeout(() => {  // HACK !!! -> take some time to be sure all target elements are rendered 
        _this.pubSubService.publishEvent(_this.field.eventName, { origin: _this.field.name, index: _this.field.index, data: _this.field.value, type: 'change' });
      }, 500);
    }
  }

  ngOnDestroy(): void {
      if (this.subscription != null) {
        this.subscription.unsubscribe();
      }
  }

  onBlur(): void {
    const _this = this;
    if (_this.field.eventName !== null && _this.field.eventTrigger != null && _this.field.eventTrigger === 'blur') {
      _this.pubSubService.publishEvent(_this.field.eventName, { origin: _this.field.name, index: _this.field.index, data: _this.field.value, type: 'blur' });
    }
  }

  onFocus(): void {
    const _this = this;
    if (_this.field.eventName !== null && _this.field.eventTrigger != null && _this.field.eventTrigger === 'focus') {
      _this.pubSubService.publishEvent(_this.field.eventName, { origin: _this.field.name, index: _this.field.index, data: _this.field.value, type: 'focus' });
    }
  }

  onPress(): void {
    const _this = this;
    if (_this.field.eventName !== null && _this.field.eventTrigger != null && _this.field.eventTrigger === 'press') {
      // Confirm first if confirmation is true before performing action
      if (_this.field.confirmButtonAction) {
        // Show confirmation dialog
        _this._dialogService.showConfimationDialog(_this.field.value ? _this.field.value : _this.field.label ? _this.field.label :_this.field.name, 'Are you sure you want to perform this action?', 'Yes', 'No', 'info').then((result) => {
          if (result.value === true) {
            // User clicked yes
            _this.pubSubService.publishEvent(_this.field.eventName, { origin: _this.field.name, index: _this.field.index, data: _this.field.value, type: 'press' });
          }
        });
      }
      else {
        // Perform action without confirmation
        _this.pubSubService.publishEvent(_this.field.eventName, { origin: _this.field.name, index: _this.field.index, data: _this.field.value, type: 'press' });
      }
    }
  }

  updateValue() {
    const _this = this;

    // Extra work needed to convert date type input
    if (_this.field.inputType === 'date' || _this.field.inputType === 'datetime' || _this.field.inputType === 'time') {
      let dateValue: any = _this.group.get(_this.field.name).value;
      let dateType = typeof dateValue;
      // Check if date in Moment type
      if (dateValue != null && dateType === 'object') {
        if (_this.field.inputType === 'date') {
          _this.field.value = HelperService.getFormattedDate(dateValue);
        }
        if (_this.field.inputType === 'datetime') {
          _this.field.value = HelperService.getFormattedDateTime(dateValue, _this.timezoneService.timezoneInfo.utc_offset);
        }
        if (_this.field.inputType === 'time') {
          _this.field.value = HelperService.getFormattedTime(dateValue);
        }
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
        // _this.pubSubService.publishEvent(_this.field.eventName, { origin: _this.field.name, index: _this.field.index, valueSet: _this.field.fullValueSet, data: _this.field.value, type: 'change' });
      }
    }
    if (_this.field.inputType === 'datetime')  {
      // To keep the same written time but replace the timezone
      // let newString = _this.field.value.replace('.000Z', '.000' + _this.timezoneService.timezoneInfo.utc_offset);
      
      // Load the date time with the included timezone
      let newString = _this.field.value;

      // If something was found, update values
      if (newString !== _this.field.value) {
        // Replace the field and form control value
        _this.field.value = newString;
        _this.group.get(_this.field.name).setValue(_this.field.value);

        // If Event publish is required on startup
        // _this.pubSubService.publishEvent(_this.field.eventName, { origin: _this.field.name, index: _this.field.index, valueSet: _this.field.fullValueSet, data: _this.field.value, type: 'change' });
      }
    }
  }

  setValue(value: any) {
    this.field.value = value;
    this.formatValue();
  }
}
