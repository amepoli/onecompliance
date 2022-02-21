import { Component, OnInit, OnDestroy, AfterViewInit, ChangeDetectorRef, OnChanges, SimpleChanges } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { FieldConfig, Item } from 'app/oc/interfaces';
import { ConsoleLoggerService, PubSubService, ValidationsService } from 'app/oc/services';
import { ReplaySubject, Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
@Component({
  selector: 'combobox',
  template: `
<mat-form-field [ngStyle]="{'width': '100%'}" *ngIf="field.isVisible != false" appearance="outline">
<mat-label style="font-size: large;">{{field.label}}</mat-label>
<mat-select [required]="isRequired" [(ngModel)]="field.value" [placeholder]="field.label" (selectionChange)="onSelection($event)" (openedChange)="openedChange($event)"
[style.padding]="'4px'" [style.border-radius]="'4px'" [style.background-color]="field.style.background_color" [style.color]="field.style.font_color">
<ngx-mat-select-search [formControl]="itemFilterCtrl" [placeholderLabel]="'Finder'">
<mat-icon ngxMatSelectSearchClear>clear</mat-icon>
</ngx-mat-select-search>
<mat-option *ngIf="isLazyLoading" value="" [style.color]="'grey'"><span ><mat-icon>cached</mat-icon></span>Loading...</mat-option>
<mat-option *ngIf="!isLazyLoading" value="" [style.color]="'grey'">Seleziona</mat-option>
<mat-option *ngFor="let item of filteredItems | async" [value]="item" [disabled]="field.readonly || readOnlyPage">{{item.name}}</mat-option>
</mat-select>

<ng-container *ngFor="let validation of field.validations;" ngProjectAs="mat-error">
<mat-error *ngIf="group.get(field.name).hasError(validation.name)">{{validation.message}}</mat-error>
</ng-container>

</mat-form-field>
`,
  styles: [`
  :host ::ng-deep .mat-form-field-type-mat-select:not(.mat-form-field-disabled) .mat-form-field-flex {
      background-color: aliceblue !important;
      border-radius: 8px;
    }  
  :host ::ng-deep .mat-form-field-flex {
      background-color: aliceblue !important;
      border-radius: 8px;
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
export class ComboboxComponent implements OnInit, OnDestroy, AfterViewInit {
  field: FieldConfig;
  group: FormGroup;
  readOnlyPage: boolean; // field.readonly overridden by page
  isRequired = false; // field is required or not
  subscription: Subscription;

  completeOptions: Item[]; // complete options list
  isLazyLoading = false; // lazy loading in progress
  isLazyLoaded = false; // Options set by calling setOptions() function

  /** control for the MatSelect filter keyword */
  public itemFilterCtrl: FormControl = new FormControl();

  /** list of items filtered by search keyword */
  public filteredItems: ReplaySubject<Item[]> = new ReplaySubject<Item[]>(1);

  /** Subject that emits when the component has been destroyed. */
  private _onDestroy = new Subject<void>();


  constructor(private pubSubService: PubSubService, 
                private cdr: ChangeDetectorRef,
                private _console: ConsoleLoggerService) { }

  private skipNextEvent = false;

  ngOnInit() {

    const _this = this;
    _this.field.style = _this.field.style == null ? { background_color: 'transparent', font_color: 'black' } : _this.field.style;
    _this.field.style.background_color = _this.field.style.background_color != null ? _this.field.style.background_color : 'transparent';
    _this.field.style.font_color = _this.field.style.font_color != null ? _this.field.style.font_color : 'black';
    // filter out null values

    _this.setOptions(_this.field.options, false);

    _this.setValue(_this.field.value);
    // if (_this.field.value != null) {
    //   // possibly compare object w/ subkeys value, let's stringify first
    //   _this.field.value = _this.field.options.find(x => JSON.stringify(x.id) === JSON.stringify(_this.field.value));
    //   // setTimeout(() => {_this.pubSubService.publishEvent(_this.field.eventName, {origin: _this.field.name, index: _this.field.index, valueSet: _this.field.fullValueSet, data: _this.field.value.id, type: 'combobox'})}, 50); 
    // }
    // else {
    //   _this.field.value = '';
    //   _this.group.get(_this.field.name).setValue(null);
    // }

    // load the initial bank list
    // _this.filteredItems.next(_this.field.options.slice());

    // listen for search field value changes
    _this.subscription = _this.itemFilterCtrl.valueChanges
      .pipe(takeUntil(_this._onDestroy))
      .subscribe(() => {
        _this.filterItems();
      });

    // Check if required
    if (_this.field.validations) {
      _this.isRequired = ValidationsService.checkIfRequired(_this.field.validations);
    }

  }

  ngAfterViewInit() {
    const _this = this;
    if (_this.field.eventName != null && _this.field.eventTrigger === 'load') {
      // this.pubSubService.publishEvent(this.field.eventName, { origin: this.field.name, index: this.field.index, valueSet: this.field.fullValueSet, data: this.getFormattedId(event.value.id), type: 'combobox' });
      setTimeout(() => {  // HACK !!! -> take some time to be sure all target elements are rendered 
        // _this.pubSubService.publishEvent(_this.field.eventName, { origin: _this.field.name, index: _this.field.index, valueSet: _this.field.fullValueSet, data: _this.getFormattedId(_this.field.value.id), type: 'combobox' });
        _this.sendEvent();
      }, 500);
    }
  }

  ngOnDestroy() {
    if(this.subscription != null) {
      this.subscription.unsubscribe();
    }

    this._onDestroy.next();
    this._onDestroy.complete();
  }

  setOptions(options: any[], skipNextEvent: boolean, isLazyLoaded: boolean = false) {
    this.completeOptions = options.filter(x =>  x && x.name !== null);
    
    this.field.options = this.getOptionsWithCurrentSelection(this.completeOptions);
    
    // load the initial bank list
    this.filteredItems.next(this.field.options.slice());
    this.skipNextEvent = skipNextEvent;

    // if lazy loading called this function, we stop the loading indicator
    this.isLazyLoading = false;
    this.isLazyLoaded = isLazyLoaded;
  }

  getOptionsWithCurrentSelection(options: Item[]) {
    let filteredOptions: Item[] = options.slice(0, Math.min(20, options.length));
    
    // Check if the selected item is inside the 20 items selected,
    // add if doesn't exist
    if (this.field.value != null && this.field.value != '') {
      if(filteredOptions.indexOf(this.field.value) < 0) {
        filteredOptions = [this.field.value, ...filteredOptions.slice(0, Math.min(19, filteredOptions.length))]        
      }  
    }
    return filteredOptions;
  }


  setValue(id){
    const _this = this;
    if(id != null && id !== ''){
      // id = JSON.stringify(id);
      if(typeof id === 'object'){
        _this.field.value = _this.completeOptions.find(x => JSON.stringify(x.id) == JSON.stringify(id));
      }
      else{
        _this.field.value = _this.completeOptions.find(x => '' + x.id == '' + id);
      }
    }
    else{
      _this.field.value = '';
      _this.group.get(_this.field.name).setValue(null);
    }
  }

  onSelection(event: any) {
    if (event.value != null) {
      this.field.value = event.value;
      if (event.value === '') {
        this.group.get(this.field.name).setValue(null);
      }
      else {
        this.group.get(this.field.name).setValue(event.value);
      }
      this.cdr.detectChanges();
    }
    else {
      this.field.value = '';
      this.group.get(this.field.name).setValue(null);
    }

    if (event.value === '' || event.value == null) { // reset color style
      this.field.style = { background_color: 'transparent', font_color: 'black' };
    }

    if (this.field.eventName != null && this.field.eventTrigger === 'select') {
      // this.pubSubService.publishEvent(this.field.eventName, { origin: this.field.name, index: this.field.index, valueSet: this.field.fullValueSet, data: this.getFormattedId(event.value.id), type: 'combobox' });
      this.sendEvent();
    }
  }

  openedChange(opened): void {
    if (opened) {
      this.onOpen();
    }
    else {
      this.onClose();
    }
  }

  onOpen(): void {
    if (this.field.lazyLoading && !this.isLazyLoaded) {
      this.isLazyLoading = true;
      this.pubSubService.publishEvent(this.field.table + '_' + this.field.name + '_combo_lazy_loading', { index: this.field.index, valueSet: this.field.fullValueSet, data: this.field.name, type: 'combobox' });
    }
  }

  onClose(): void {
    // Zee update
    // Now that we are limiting the list to only 20, 
    // it is probably safe to keep list in memory

    // purge all 
    // if (this.field.lazyLoading && this.field.value != null) {
    //     this.setOptions([this.field.value], false);
    // }
  }

  resetSelection() {
    // this.group.get(this.field.name).reset();
  }

  private filterItems() {
    if (!this.field.options) {
      return;
    }
    // get the search keyword
    let search = this.itemFilterCtrl.value;
    if (!search) {
      this.field.options = this.getOptionsWithCurrentSelection(this.completeOptions);      
    }
    else {
      search = search.toLowerCase();
      this.field.options = this.getOptionsWithCurrentSelection(this.completeOptions.filter(item => item.name.toLowerCase().indexOf(search) > -1));
    }
    
    this.filteredItems.next(this.field.options.slice());
    return;

  }

  private getFormattedId(id: any): any {
    //return this.field.inputType === 'text' ? `'${id}'` : id;
    return id;
  }

  private sendEvent() {
    // if (!this.skipNextEvent) {
    // }
    // else {
    //   this.skipNextEvent = false;
    // }

    let value = this.group.get(this.field.name).value != null ? this.getFormattedId(this.group.get(this.field.name).value.id) : null;
    if (!value) {
      value = this.field.value && this.field.value.id ? this.field.value.id : null;
    }
    this._console.log('value', value);
    this.pubSubService.publishEvent(this.field.eventName, { origin: this.field.name, index: this.field.index, valueSet: this.field.fullValueSet, data: value, type: 'combobox' });

  }
}
