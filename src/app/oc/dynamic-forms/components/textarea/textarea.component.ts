import { AfterViewInit, Component, ElementRef, HostBinding, OnInit, ViewChild, ViewEncapsulation } from "@angular/core";
import { FormGroup } from "@angular/forms";
import { ConsoleLoggerService, DialogService, HelperService, PubSubService, TimezoneService } from "app/oc/services";
import { FieldConfig } from 'app/oc/interfaces';
import { Subscription } from 'rxjs';

@Component({
  selector: "app-textarea",
  template: `
<mat-form-field [ngClass]="field.eventTrigger === 'press' && (field.readonly || readOnlyPage)? 'readOnlyPressable': ''" (click)="onPress()" *ngIf="field.isVisible != false" [ngStyle]="{'width': '100%'}" appearance="outline" [formGroup]="group">
<mat-label>{{field.label}}</mat-label>
<textarea class="text-area" (input)="setHeights()" #textAreaEl
 matInput [formControlName]="field.name" [readonly]="field.readonly || readOnlyPage" matTextareaAutosize
 matAutosizeMinRows="1" matAutosizeMaxRows="5" [style.padding]="'4px'" [style.border-radius]="'4px'"
 [style.background-color]="style.background_color" [style.color]="style.font_color"
 [style.font-size]="style.font_size" [style.font-style]="style.font_style"
 [style.font-weight]="style.font_weight"
 (blur)="onBlur()" (focus)="onFocus()" (change)="updateValue()"></textarea>
<ng-container *ngFor="let validation of field.validations;" ngProjectAs="mat-error">
<mat-error *ngIf="group.get(field.name).hasError(validation.name)">{{validation.message}}</mat-error>
</ng-container>
</mat-form-field>
`,
  styles: [`
    :host ::ng-deep .mat-form-field-flex {
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

    :host ::ng-deep .readOnlyPressable .mat-form-field-wrapper .mat-form-field-flex .mat-form-field-infix textarea {
      color: #2196f3 !important;
      cursor: pointer;
      font-weight: 500 !important;
      text-decoration: underline;
    }
    .text-area {
      min-height: 18px !important;
      max-height: 256px !important;
    }
  `],
  host: {
    '[style.padding-top.px]': 'field.isVisible? "16": "0"',
    '[style.margin-right]': 'field.isVisible? "1%": "0"',
    '[style.margin-left]': 'field.isVisible? "1%": "0"',
    '[style.width]': 'field.isVisible? field.width + "%": "0"'
  }
})
export class TextAreaComponent implements OnInit, AfterViewInit {
  field: FieldConfig;
  group: FormGroup;
  readOnlyPage: boolean; // field.readonly overridden by page
  maxHeight: number = 256; // Maximum height of textarea element

  style = {
    background_color: 'transparent',
    font_color: 'black',
    font_size: 'unset',
    font_style: 'unset',
    font_weight: 'unset'
  };

  subscription: Subscription;

  @ViewChild('textAreaEl') textAreaEl: ElementRef;
  @HostBinding('style.height.px') textAreaComponentHeight = '0';
  
  constructor(private timezoneService: TimezoneService,
    private pubSubService: PubSubService,
    private _console: ConsoleLoggerService,
    private _dialogService: DialogService) { }
  
  ngOnInit() {
    const _this = this;
    _this._console.log('textareaHeight:', _this.field.textareaHeight);
    if (_this.field.eventName !== null && _this.field.eventTrigger != null && _this.field.eventTrigger === 'change') {
      _this.subscription = _this.group.get(_this.field.name).valueChanges.subscribe(value => {
        _this.pubSubService.publishEvent(_this.field.eventName, { origin: _this.field.name, index: _this.field.index, valueSet: _this.field.fullValueSet, data: value, type: 'change' });
      });
    }
    if (_this.field.eventName !== null && _this.field.eventTrigger != null && _this.field.eventTrigger === 'blur') {
      setTimeout(() => _this.pubSubService.publishEvent(_this.field.eventName, { origin: _this.field.name, index: _this.field.index, valueSet: _this.field.fullValueSet, data: _this.field.value, type: 'blur' }), 50);
    }
  }

  setHeights() {
    // Reset field height
    this.textAreaEl.nativeElement.style.height = 'inherit';

    // Get the computed styles for the element
    var computed = window.getComputedStyle(this.textAreaEl.nativeElement);

    // Calculate the height
    var height = Math.min(parseInt(computed.getPropertyValue('border-top-width'), 10)
      + parseInt(computed.getPropertyValue('padding-top'), 10)
      + this.textAreaEl.nativeElement.scrollHeight
      + parseInt(computed.getPropertyValue('padding-bottom'), 10)
      + parseInt(computed.getPropertyValue('border-bottom-width'), 10), this.maxHeight);

    // Apply heights
    this.textAreaEl.nativeElement.style.height = height + 'px';
    this.textAreaComponentHeight = (height + 78) + "";
  }

  ngAfterViewInit(): void {
    const _this = this;
    // publish a change event to start if expected
    if (_this.field.eventName !== null && _this.field.eventTrigger != null && _this.field.eventTrigger === 'change') {
      setTimeout(() => {  // HACK !!! -> take some time to be sure all target elements are rendered 
        _this.pubSubService.publishEvent(_this.field.eventName, { origin: _this.field.name, index: _this.field.index, data: _this.field.value, type: 'change' });
      }, 500);
    }

    if (_this.field.eventName !== null && _this.field.eventTrigger != null && _this.field.eventTrigger === 'press') {
      console.log(this.field);
    }
    _this.setHeights();
    _this.loadStyles();
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
  
  loadStyles() {
    if(this.field.style) {
      if(this.field.style.background_color) {
        this.style.background_color = this.field.style.background_color;
      }
      if(this.field.style.font_color) {
        this.style.font_color = this.field.style.font_color;
      }
      if(this.field.style.font_size) {
        this.style.font_size = this.field.style.font_size;
      }
      if(this.field.style.font_style) {
        this.style.font_style = this.field.style.font_style;
      }
      if(this.field.style.font_weight) {
        this.style.font_weight = this.field.style.font_weight;
      }
    }
  }
}
