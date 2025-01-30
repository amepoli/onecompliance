import { AfterViewInit, Component, ElementRef, HostBinding, OnInit, ViewChild, ViewEncapsulation } from "@angular/core";
import { UntypedFormGroup } from "@angular/forms";
import { ConsoleLoggerService, DialogService, FormsService, HelperService, PubSubService, TimezoneService, ValidationsService } from "app/oc/services";
import { FieldConfig } from 'app/oc/interfaces';
import { Subscription } from 'rxjs';
import { AngularEditorConfig } from "@kolkov/angular-editor";

@Component({
  selector: "app-textarea",
  templateUrl: './textarea.component.html',
  styleUrls: ['./textarea.component.scss'],
  host: {
    '[style.padding-top.px]': 'field.isVisible? "8": "0"',
    // '[style.padding-bottom.px]': 'field.isVisible? "16": "0"',
    '[style.margin-right]': 'field.isVisible? "0.5%": "0"',
    '[style.margin-left]': 'field.isVisible? "0.5%": "0"',
    '[style.width]': 'field.isVisible? field.width + "%": "0"',
    '[style.height.px]': 'field.isVisible? "76": "0"',

  }
})
export class TextAreaComponent implements OnInit, AfterViewInit {
  field: FieldConfig;
  group: UntypedFormGroup;
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

  @ViewChild('textAreaEl') textAreaEl: ElementRef | any;
  @HostBinding('style.height') textAreaComponentHeight = '211px';
  
  htmlContent: string = "";

  editorConfig: AngularEditorConfig = {
    editable: true,
    spellcheck: true,
    height: '70px',
    minHeight: '70px',
    maxHeight: 'auto',
    width: '100%',
    minWidth: '100%',
    translate: 'yes',
    enableToolbar: true,
    showToolbar: true,
    placeholder: 'Enter text here...',
    defaultParagraphSeparator: '',
    defaultFontName: '',
    defaultFontSize: '',
    customClasses: [
      
    ],
    fonts: [
      {class: 'arial', name: 'Arial'},
      {class: 'times-new-roman', name: 'Times New Roman'},
      {class: 'calibri', name: 'Calibri'},
      {class: 'comic-sans-ms', name: 'Comic Sans MS'}
    ],
    uploadWithCredentials: false,
    sanitize: true,
    toolbarPosition: 'top',
    toolbarHiddenButtons: [
      [], //['bold', 'italic'],
      [] //['fontSize']
    ]
  };
  isRequired = false; // field is required or not


  constructor(private timezoneService: TimezoneService,
    private pubSubService: PubSubService,
    private _console: ConsoleLoggerService,
    private _dialogService: DialogService,
    private _formsService: FormsService) { }
  
  ngOnInit() {
    const _this = this;
    _this._console.log('textareaHeight:', _this.field.textareaHeight);
    if (_this.field.eventName !== null && _this.field.eventTrigger != null && _this.field.eventTrigger === 'change') {
      _this.subscription = _this.group.get(_this.field.name).valueChanges.subscribe(value => {
        _this.pubSubService.publishEvent(_this.field.eventName, { origin: _this.field.name, index: _this.field.index, valueSet: _this.field.fullValueSet, data: value, type: 'change' });
      });
    }
    // if (_this.field.eventName !== null && _this.field.eventTrigger != null && _this.field.eventTrigger === 'blur') {
    //   setTimeout(() => _this.pubSubService.publishEvent(_this.field.eventName, { origin: _this.field.name, index: _this.field.index, valueSet: _this.field.fullValueSet, data: _this.field.value, type: 'blur' }), 50);
    // }

     // Check if required
     if (_this.field.validations) {
      _this.isRequired = ValidationsService.checkIfRequired(_this.field.validations);
    }

  }
  
  setHeights() {
    // Reset field height
    const nativeElement = this.textAreaEl.nativeElement? this.textAreaEl.nativeElement: (this.textAreaEl.textArea && this.textAreaEl.textArea.nativeElement? this.textAreaEl.textArea.nativeElement: null);
    
    if(nativeElement) {

      nativeElement.style.height = 'inherit';

      // Get the computed styles for the element
      var computed = window.getComputedStyle(nativeElement);
  
      // Calculate the height
      var height = Math.min(parseInt(computed.getPropertyValue('border-top-width'), 10)
        + parseInt(computed.getPropertyValue('padding-top'), 10)
        + (nativeElement.scrollHeight - 16)
        + parseInt(computed.getPropertyValue('padding-bottom'), 10)
        + parseInt(computed.getPropertyValue('border-bottom-width'), 10), this.maxHeight);
  
      // Apply heights
      nativeElement.style.height = height + 'px';
      this.textAreaComponentHeight = (height + 56) + "px";
    }
    else {
      this.textAreaComponentHeight = "211px";
    }
  }

  ngAfterViewInit(): void {
    const _this = this;
    // publish a change event to start if expected
    // if (_this.field.eventName !== null && _this.field.eventTrigger != null && _this.field.eventTrigger === 'change') {
    //   setTimeout(() => {  // HACK !!! -> take some time to be sure all target elements are rendered 
    //     _this.pubSubService.publishEvent(_this.field.eventName, { origin: _this.field.name, index: _this.field.index, data: _this.field.value, type: 'change' });
    //   }, 500);
    // }

    if (_this.field.eventName != null && _this.field.eventTrigger === 'load') {
      // this.pubSubService.publishEvent(this.field.eventName, { origin: this.field.name, index: this.field.index, valueSet: this.field.fullValueSet, data: this.getFormattedId(event.value.id), type: 'combobox' });
      setTimeout(() => {  // HACK !!! -> take some time to be sure all target elements are rendered 
        // _this.pubSubService.publishEvent(_this.field.eventName, { origin: _this.field.name, index: _this.field.index, valueSet: _this.field.fullValueSet, data: _this.getFormattedId(_this.field.value.id), type: 'combobox' });
        _this.pubSubService.publishEvent(_this.field.eventName, { origin: _this.field.name, index: _this.field.index, data: _this.field.value, type: 'change' });
      }, 500);
    }

    if(_this.field.showTextAreaRichFormatter) {
      _this.htmlContent = _this.field.value;
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
    if(_this.field.showTextAreaRichFormatter) {
      _this.updateValue();
    }
    if(_this.field.onChangeResetKey)
    {
      _this.sendResetByKeyEvent()
    }

    _this.field.onBlur && _this.field.onBlur(this.field.value, this.field);

    _this._formsService.performAutoSave();
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

    this.field.onClick && this.field.onClick(this.field);
  }
  
  updateValue() {
    const _this = this;

    if(_this.field.showTextAreaRichFormatter) {
      // Copy from html content
      _this.field.value = _this.htmlContent;
      _this.group.get(_this.field.name).setValue(_this.field.value);
    }
    else if (_this.field.inputType === 'date' || _this.field.inputType === 'datetime' || _this.field.inputType === 'time') {
      // Extra work needed to convert date type input
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

  sendResetByKeyEvent() {
    this.pubSubService.publishEvent(this.field.table + '_' + this.field.name + '_reset_by_key', { origin: this.field.name, index: this.field.index, valueSet: this.field.fullValueSet, data: this.field.onChangeResetKey });
  }

  public reset() {
    this.field.value = null;
  }
}
