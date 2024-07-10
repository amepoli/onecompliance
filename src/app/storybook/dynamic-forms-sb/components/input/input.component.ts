import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { FieldConfig } from '../../../../oc/interfaces';

@Component({
  selector: 'app-input',
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.scss'],
  host: {
    // '[style.padding-top.px]': 'field.isVisible? "4": "0"',
    // '[style.padding-bottom.px]': 'field.isVisible? "4": "0"',
    '[style.margin-right]': 'field.isVisible? "0.5%": "0"',
    '[style.margin-left]': 'field.isVisible? "0.5%": "0"',
    '[style.width]': 'field.isVisible? field.width + "%": "0"',
    '[style.height.px]': 'field.isVisible? "76": "0"',
  }
})
export class InputComponent implements OnInit, AfterViewInit, OnDestroy {
  field: FieldConfig;
  group!: UntypedFormGroup;
  readOnlyPage: boolean = false; // field.readonly overridden by page
  isRequired = false; // field is required or not

  // For future use
  // @HostBinding('style.margin-right') marginRight = '0.5%';

  constructor() { 
  }

  ngOnInit(): void {
    const _this = this;
    console.log(_this.field);
    _this.field.style = _this.field.style == null ? { background_color: 'transparent', font_color: 'black' } : _this.field.style;
    _this.field.style.background_color = _this.field.style.background_color != null ? _this.field.style.background_color : 'transparent';
    _this.field.style.font_color = _this.field.style.font_color != null ? _this.field.style.font_color : 'black';
    
    
    // Format the field value if needed
    _this.formatValue();

    console.log('Inside input component!');
    console.log(_this.field.isVisible);
    console.log(_this.field.width);
  }

  ngAfterViewInit(): void {
    const _this = this;    
    
    let fieldValue: any = _this.group?.get(_this.field.name!)?.value?.toString();      
    if(_this.field.readonly && fieldValue !== null) {
      if (_this.field.inputType === 'date') {
        var d = new Date(fieldValue);
        _this.field.value = d.toLocaleDateString('en-US');
      }
      else if (_this.field.inputType === 'datetime') {
        // var d = new Date(HelperService.getFormattedDateTime(fieldValue, _this.timezoneService.timezoneInfo.utc_offset)); /* midnight in China on April 13th */
        // _this.field.value = d.toLocaleString('en-US', { timeZone: _this.timezoneService.timezoneInfo.timezone });
      }
      else if (_this.field.inputType === 'time') {
        // _this.field.value = HelperService.getFormattedTime(fieldValue);
      }
      else {
        _this.field.value = fieldValue;
      }
    }
  }

  ngOnDestroy(): void {
      
  }

  onBlur(): void {
  }

  onFocus(): void {
  }

  onPress(): void {
    
  }

  updateValue() {
    const _this = this;

    // Extra work needed to convert date type input
    if (_this.field.inputType === 'date' || _this.field.inputType === 'datetime' || _this.field.inputType === 'time') {
      let dateValue: any = _this.group?.get(_this.field.name!)?.value;
      let dateType = typeof dateValue;
      // Check if date in Moment type
      if (dateValue != null && dateType === 'object') {
        if (_this.field.inputType === 'date') {
          // _this.field.value = HelperService.getFormattedDate(dateValue);
        }
        // if (_this.field.inputType === 'datetime') {
        //   _this.field.value = HelperService.getFormattedDateTime(dateValue, _this.timezoneService.timezoneInfo.utc_offset);
        // }
        if (_this.field.inputType === 'time') {
          // _this.field.value = HelperService.getFormattedTime(dateValue);
        }
        _this.group?.get(_this.field.name!)?.setValue(_this.field.value);
      }
      else {
        // Copy as it is
        _this.field.value = _this.group?.get(_this.field.name!)?.value;
      }
    }
    if(_this.field.inputType === 'number')
    {
      let value: any = _this.group?.get(_this.field.name!)?.value;
      if(value)
      {
        _this.field.value = value;
      }
      else
      {   
        _this.field.value = null; 
        _this.group?.get(_this.field.name!)?.setValue(_this.field.value);
      }
    }
    else {
      // Copy as it is
      _this.field.value = _this.group?.get(_this.field.name!)?.value;
    }
  }

  formatValue() {
    let _this = this;
    if (_this.field.inputType === 'date') {
      // Replace all found markers
      let newString = _this.field.value; // HelperService.getFormattedString(_this.field.value);

      // If something was found, update values
      if (newString !== _this.field.value) {
        // Replace the field and form control value
        _this.field.value = newString;
        _this.group?.get(_this.field.name!)?.setValue(_this.field.value);

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
        _this.group?.get(_this.field.name!)?.setValue(_this.field.value);

        // If Event publish is required on startup
        // _this.pubSubService.publishEvent(_this.field.eventName, { origin: _this.field.name, index: _this.field.index, valueSet: _this.field.fullValueSet, data: _this.field.value, type: 'change' });
      }
    }
  }

  setValue(value: any) {
    this.field.value = value;
    this.formatValue();
  }

  public reset() {
    this.field.value = null;
  }
}
