import { Component, OnInit, OnDestroy, AfterViewInit, ChangeDetectorRef, OnChanges, SimpleChanges, HostBinding } from '@angular/core';
import { UntypedFormGroup, UntypedFormControl } from '@angular/forms';
import { ReplaySubject, Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FieldConfig, Item } from '../../../../oc/interfaces';

@Component({
  selector: 'combobox',
  templateUrl: './combobox.component.html',
  styleUrls: ['./combobox.component.scss'],
  host: {
    // '[style.padding-top.px]': 'field.isVisible? "20": "0"',
    // '[style.padding-bottom.px]': 'field.isVisible? "20": "0"',
    '[style.margin-right]': 'field.isVisible? "0.5%": "0"',
    '[style.margin-left]': 'field.isVisible? "0.5%": "0"',
    '[style.width]': 'field.isVisible? field.width + "%": "0"',
    // '[style.height.px]': 'field.isVisible? "76": "0"',
  }
})
export class ComboboxComponent implements OnInit, OnDestroy, AfterViewInit {
  field: FieldConfig;
  group: UntypedFormGroup;
  readOnlyPage: boolean; // field.readonly overridden by page
  isRequired = false; // field is required or not
  subscription: Subscription;
  @HostBinding('style.height') ComboBoxHeight = 'field.isVisible? "96px": "0px"';
  completeOptions: Item[]; // complete options list
  isLazyLoading = false; // lazy loading in progress
  isLazyLoaded = false; // Options set by calling setOptions() function
  isMultiSelect: boolean | undefined = false;
  showTagsView = false;
  debugMode = false;
  readOnly = false;
  tags: any[] =  [];
  value: any;
 

  /** control for the MatSelect filter keyword */
  public itemFilterCtrl: UntypedFormControl = new UntypedFormControl();
  public tagsFilterCtrl: UntypedFormControl = new UntypedFormControl();


  /** list of items filtered by search keyword */
  public filteredItems: ReplaySubject<Item[]> = new ReplaySubject<Item[]>(1);
  public filteredTagsItems: ReplaySubject<Item[]> = new ReplaySubject<Item[]>(1);

  /** Subject that emits when the component has been destroyed. */
  private _onDestroy = new Subject<void>();


  constructor(private cdr: ChangeDetectorRef) { }

  private skipNextEvent = false;

  ngOnInit() {

    const _this = this;
    _this.field.style = _this.field.style == null ? { background_color: 'transparent', font_color: 'black' } : _this.field.style;
    _this.field.style.background_color = _this.field.style.background_color != null ? _this.field.style.background_color : 'transparent';
    _this.field.style.font_color = _this.field.style.font_color != null ? _this.field.style.font_color : 'black';
    // filter out null values

    _this.isMultiSelect = _this.isMultiSelect != null ? _this.field.isMultiSelect : false;
    _this.showTagsView = _this.field.showTagsView !=null ? _this.field.showTagsView : false;
    

    if(_this.isMultiSelect || _this.showTagsView)
    { 
      _this.field.value = _this.field.value != null ? (Array.isArray(_this.field.value) ? _this.field.value :_this.field.value.includes("[") ? JSON.parse( _this.field.value) : [_this.field.value]) : null;
      if(_this.field.options && _this.field.options[0] != null && _this.field.value && _this.field.options.length != _this.field.value.length)
      {
        let newValue: any[] = [];
        _this.field.value.forEach((element: any) => {
          if(_this.field?.options?.some(option=> option.id == element ))
          {
            newValue.push(element)
          }
        });
        _this.field.value = newValue;
      }
    }

    _this.setOptions((_this.field?.options && _this.field.options[0] != null ? _this.field.options : []) , false);
    _this.setValue(_this.field.value);

    if(_this.showTagsView)
    {
      _this.isMultiSelect = true;
      if(_this.field.value)
      {
        this.tags = _this.field.value.map(fieldValue=>{
          return {
             id: fieldValue.id,
             name : fieldValue.name
             }
        });  
      }
    }
  
    // listen for search field value changes
    _this.subscription = _this.itemFilterCtrl.valueChanges
      .pipe(takeUntil(_this._onDestroy))
      .subscribe(() => {
        _this.filterItems();
      });

      if(this.showTagsView)
      {
        _this.subscription = _this.tagsFilterCtrl.valueChanges
        .pipe(takeUntil(_this._onDestroy))
        .subscribe(() => {
          _this.filterTagItems();
        });
      }
  }

  ngAfterViewInit() {
  }

  ngOnDestroy() {
    if(this.subscription != null) {
      this.subscription.unsubscribe();
    }

    this._onDestroy.next(null);
    this._onDestroy.complete();
  }

  setOptions(options: any[], skipNextEvent: boolean, isLazyLoaded: boolean = false) {
    this.completeOptions = options.filter(x =>  x && x.name !== null);
    
    this.field.options = this.getOptionsWithCurrentSelection(this.completeOptions);
    
    // load the initial bank list
    this.filteredItems.next(this.field.options.slice());


    if(this.showTagsView)
    {
      if(isLazyLoaded)
      {
        this.filterOptionsBasedOnSelectedTags(this.field.options);
      }
      else
      {
        this.filteredTagsItems.next(this.field.options.slice());
      }
    }
  
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
      if(this.isMultiSelect || this.showTagsView)
      {
        this.field.value.forEach(value => {
          let isExist =  filteredOptions.some(option=> option.id == (value ?? null) || option.id == value.id );
          if(!isExist ) {
          filteredOptions = [this.field.value, ...filteredOptions.slice(0, Math.min(19, filteredOptions.length))]        
          }  
        });
      }
      else{
        let isExist =  filteredOptions.some(option=> option.id == (this.field.value ?? null) || option.id == this.field.value.id );
        if(!isExist ) {
          filteredOptions = [this.field.value, ...filteredOptions.slice(0, Math.min(19, filteredOptions.length))]        
        }  
      }
    }
    // if (this.field.value != null && this.field.value != '') {
    //     if(filteredOptions.indexOf(this.field.value) < 0 ) {
    //       filteredOptions = [this.field.value, ...filteredOptions.slice(0, Math.min(19, filteredOptions.length))]        
    //     }
    // }
    return filteredOptions;
  }

  setValue(ids: any){
    const _this = this;
    if(ids != null && ids !== ''){
    if(_this.isMultiSelect || _this.showTagsView)
    {
      let values: any[] =[];
      ids.forEach(id => {
        if(typeof id === 'object'){
           let value: any = _this.completeOptions.find(x => JSON.stringify(x.id) == JSON.stringify(id));
           values.push(value);
        }
        else{
          let value: any = _this.completeOptions.find(x => '' + x.id == '' + id);
          values.push(value);
        }
        
      });
     _this.field.value = values;

    }
    else
    {
      let id = ids;
      if(typeof id === 'object'){
        _this.field.value = _this.completeOptions.find(x => JSON.stringify(x.id) == JSON.stringify(id));
      }
      else{
        _this.field.value = _this.completeOptions.find(x => '' + x.id == '' + id);
      }
    }
  }
    else{
      _this.field.value = '';
      _this.group?.get(_this.field.name!)?.setValue(null);
    }
  }

  onSelection(event: any) {
    if (event.value != null) {
      this.field.value = event.value;
      if (event.value === '') {
        this.group?.get(this.field.name!)?.setValue(null);
      }
      else {
        this.group?.get(this.field.name!)?.setValue(event.value);
      }
      this.cdr.detectChanges();
    }
    else {
      this.field.value = '';
      this.group?.get(this.field.name!)?.setValue(null);
    }

    if (event.value === '' || event.value == null) { // reset color style
      this.field.style = { background_color: 'transparent', font_color: 'black' };
    }

  }

  onTagsSelection(event : any)
  {
    const _this = this;
    if (event.value != null) 
    {
      let value = event.value;

      _this.field.value.push(event.value);
      _this.tags.push(event.value)

      _this.group?.get(_this.field.name!)?.setValue(_this.tags);
      _this.cdr.detectChanges();
      _this.filterOptionsBasedOnSelectedTags(_this.field.options)
    }
    _this.lazyLoad();
    _this.value = null;
  }

  private filterOptionsBasedOnSelectedTags(options : any)
  {
    const _this = this;
    let newOptions =  options.filter(x => !Array.isArray(x));
    _this.field.value.forEach(field=>{
    if(newOptions.some(option=> option.id == field))
    {
      let index= newOptions.findIndex(option=> option.id == field);
      if (index > -1) 
      { 
        newOptions.splice(index, 1); 
      }     
      }
    });
    _this.filteredTagsItems.next(newOptions.slice());
  }

  onRemoveTag(tag: any)
  {
    const _this = this;

    // Removing selected tag from tags list
    let index = _this.tags.indexOf(tag);
    if(index > -1)
    {
      _this.tags.splice(index, 1);
    }

    // Removing selected tag value from field values
    if(_this.field.value && _this.field.value.some(value=> value.id== tag.id) )
    {
      let index= _this.field.value.findIndex(value=> value.id== tag.id);
      if (index > -1) { 
        _this.field.value.splice(index, 1);
        _this.group?.get(_this.field.name!)?.setValue(_this.tags);

      }
    }
    _this.lazyLoad();
    _this.filterOptionsBasedOnSelectedTags(_this.field.options);  
    _this.value = null;

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
    this.lazyLoad();
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
    // this.group?.get(this.field.name!)?.reset();
  }

  lazyLoad(forced: boolean = false) {
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

  private filterTagItems() {
    if (!this.field.options) {
      return;
    }
    // get the search keyword
    let search = this.tagsFilterCtrl.value;
    if (!search) {
      this.field.options = this.getOptionsWithCurrentSelection(this.completeOptions);      
    }
    else {
      search = search.toLowerCase();
      this.field.options = this.getOptionsWithCurrentSelection(this.completeOptions.filter(item => item.name.toLowerCase().indexOf(search) > -1));
    }
    
    this.filterOptionsBasedOnSelectedTags(this.field.options.slice());

    return;

  }

  private getFormattedId(id: any): any {
    //return this.field.inputType === 'text' ? `'${id}'` : id;
    if(this.isMultiSelect || this.showTagsView) {
      return id && id.length> 0? id.map(x => x.id): [];
    }
    else {
      return id? id.id: null;
    }
  }

  public reset() {
    this.field.value = null;
    this.lazyLoad(true);
  }
}
