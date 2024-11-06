import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { FuseTranslationLoaderService } from '@fuse/services/translation-loader.service';
import { FieldConfig } from 'app/oc/interfaces';
import { ConsoleLoggerService, DialogService, HelperService, PubSubService, ValidationsService } from 'app/oc/services';
import { TimezoneService } from 'app/oc/services/timezone.service';
import * as moment from 'moment';
import { Moment } from 'moment';
import { Subscription } from 'rxjs';

import { locale as english } from 'app/oc/i18n/en';
import { locale as italian } from 'app/oc/i18n/it';

@Component({
  selector: 'app-input',
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.scss'],
  host: {
    '[style.padding-top.px]': 'field.isVisible? "8": "0"',
    // '[style.padding-bottom.px]': 'field.isVisible? "4": "0"',
    '[style.margin-right]': 'field.isVisible? "0.5%": "0"',
    '[style.margin-left]': 'field.isVisible? "0.5%": "0"',
    '[style.width]': 'field.isVisible? field.width + "%": "0"',
    '[style.height.px]': 'field.isVisible? "76": "0"',
  }
})
export class InputComponent implements OnInit, AfterViewInit, OnDestroy {
  field: FieldConfig;
  group: UntypedFormGroup;
  readOnlyPage: boolean = false; // field.readonly overridden by page
  isRequired = false; // field is required or not

  subscription: Subscription;

  timeValue: string;

  // For future use
  // @HostBinding('style.margin-right') marginRight = '0.5%';

  constructor(private timezoneService: TimezoneService,
              private pubSubService: PubSubService,
              private _console: ConsoleLoggerService,
              private _dialogService: DialogService,
              private _fuseTranslationLoaderService: FuseTranslationLoaderService) { }
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

    _this._fuseTranslationLoaderService.loadTranslations(english, italian);

    // When we create an input component, we are running it's blur event
    // Commenting this event for testing
    //if (_this.field.eventName !== null && _this.field.eventTrigger != null && _this.field.eventTrigger === 'blur') {
    //  setTimeout(() => _this.pubSubService.publishEvent(_this.field.eventName, { origin: _this.field.name, index: _this.field.index, valueSet: _this.field.fullValueSet, data: _this.field.value, type: 'blur' }), 50);
    // }

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
    // This lines are put in order to make possible answers appear. We should find a different solution.
    //  setTimeout(() => {  // HACK !!! -> take some time to be sure all target elements are rendered 
    //    if (_this.field.eventName !== null && _this.field.eventTrigger != null && _this.field.eventTrigger === 'change') {
    //      _this.pubSubService.publishEvent(_this.field.eventName, { origin: _this.field.name, index: _this.field.index, data: _this.field.value, type: 'change' });
    //    }
    //  }, 500);

    if (_this.field.eventName != null && _this.field.eventTrigger === 'load') {
      setTimeout(() => {  
        // _this.pubSubService.publishEvent(_this.field.eventName, { origin: _this.field.name, index: _this.field.index, valueSet: _this.field.fullValueSet, data: _this.getFormattedId(_this.field.value.id), type: 'combobox' });
        _this.pubSubService.publishEvent(_this.field.eventName, { origin: _this.field.name, index: _this.field.index, data: _this.field.value, type: 'change' });
      }, 500);
    }

    let fieldValue: any = _this.group.get(_this.field.name).value;      
    if(_this.field.readonly && fieldValue !== null) {
      if (_this.field.inputType === 'date') {
        var d = new Date(fieldValue);
        _this.field.value = d.toLocaleDateString('en-US');
      }
      else if (_this.field.inputType === 'datetime') {
        var d = new Date(HelperService.getFormattedDateTime(fieldValue, _this.timezoneService.timezoneInfo.utc_offset)); /* midnight in China on April 13th */
        _this.field.value = d.toLocaleString('en-US', { timeZone: _this.timezoneService.timezoneInfo.timezone });
      }
      else {
        _this.field.value = fieldValue != null && typeof fieldValue === 'number' ? fieldValue.toString() : fieldValue;
      }
    }

    if (_this.field.inputType === 'time') {
      _this.timeValue = HelperService.getFormattedTime(fieldValue);
      // _this.field.value = fieldValue;
      // _this.group.get(_this.field.name).setValue(fieldValue);
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
    if(_this.field.onChangeResetKey)
    {
      _this.sendResetByKeyEvent()
    }

    _this.field.onBlur && _this.field.onBlur(this.field.value, this.field);
  }

  onFocus(): void {
    const _this = this;
    if (_this.field.eventName !== null && _this.field.eventTrigger != null && _this.field.eventTrigger === 'focus') {
      _this.pubSubService.publishEvent(_this.field.eventName, { origin: _this.field.name, index: _this.field.index, data: _this.field.value, type: 'focus' });
    }
  }

  onPress(): void {
    const _this = this;

    // Trigger click event
    _this.field.onClick && _this.field.onClick(_this.field);

    if (_this.field.eventName !== null && _this.field.eventTrigger != null && _this.field.eventTrigger === 'press') {
      // Confirm first if confirmation is true before performing action
      if (_this.field.confirmButtonAction) {
        // Show confirmation dialog
        _this._dialogService.showConfimationDialog(_this.field.value ? _this.field.value : _this.field.label ? _this.field.label :_this.field.name, 'Are you sure you want to perform this action?', 'Yes', 'No', 'info').then((result) => {
          if (result.value === true) {
            // provide index in case of multiple instances of the button                    
            _this.pubSubService.publishEvent(_this.field.eventName, { origin: _this.field.name, index: _this.field.index, valueSet: _this.field.fullValueSet, data: _this.field.value, type: 'press' });
          }
        });
      }
      else {
        // Perform action without confirmation
        _this.pubSubService.publishEvent(_this.field.eventName, { origin: _this.field.name, index: _this.field.index, valueSet: _this.field.fullValueSet, data: _this.field.value, type: 'press' });
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
    if(_this.field.inputType === 'number')
    {
      let value: any = _this.group.get(_this.field.name).value;
      if(value)
      {
        _this.field.value = value;
      }
      else
      {   
        _this.field.value = null; 
        _this.group.get(_this.field.name).setValue(_this.field.value);
      }
    }
    else {
      // Copy as it is
      _this.field.value = _this.group.get(_this.field.name).value;
    }

    _this.field.onBlur && _this.field.onBlur(this.field.value, this.field);

  }

  onTimeSet($event: string) {
    const _this = this;
    _this.timeValue = $event;
    _this.field.value = HelperService.getDecodedTime(_this.timeValue);
    _this.group.get(_this.field.name).setValue(_this.field.value);
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

  sendResetByKeyEvent() {
    this.pubSubService.publishEvent(this.field.table + '_' + this.field.name + '_reset_by_key', { origin: this.field.name, index: this.field.index, valueSet: this.field.fullValueSet, data: this.field.onChangeResetKey });
  }

  public reset() {
    this.field.value = null;
  }
}
