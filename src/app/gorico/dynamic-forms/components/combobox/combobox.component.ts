import { Component, OnInit, OnDestroy} from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { FieldConfig, Item } from '../../field.interface';
import { ReplaySubject, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NgxPubSubService } from '@pscoped/ngx-pub-sub';
@Component({
  selector: 'combobox',
  template: `
<mat-form-field [ngStyle]="{'margin-right': '2%', 'margin-left': '2%','width': field.width+'%'}" *ngIf="field.isVisible != false" appearance="outline" [formGroup]="group">
<mat-label>{{field.label}}</mat-label>
<mat-select [ngModel]="field.value" [formControlName]="field.name" [placeholder]="field.label" (selectionChange)="onSelection($event)">
<ngx-mat-select-search [formControl]="itemFilterCtrl" [placeholderLabel]="'Finder'"></ngx-mat-select-search>
<mat-option *ngFor="let item of filteredItems | async" [value]="item" [disabled]="field.readonly">{{item.name}}</mat-option>
</mat-select>
</mat-form-field>
`,
  styles: []
})
export class ComboboxComponent implements OnInit, OnDestroy {
  field: FieldConfig;
  group: FormGroup;

  /** control for the MatSelect filter keyword */
  public itemFilterCtrl: FormControl = new FormControl();

  /** list of items filtered by search keyword */
  public filteredItems: ReplaySubject<Item[]> = new ReplaySubject<Item[]>(1);

   /** Subject that emits when the component has been destroyed. */
   private _onDestroy = new Subject<void>();


  constructor(private pubsubService: NgxPubSubService) {}

  ngOnInit() {
    
    const _this = this;
    // filter out null values

    _this.field.options = _this.field.options.filter(x => x.name !== null); 

    if (_this.field.value != null) {
        _this.field.value = _this.field.options.find(x => x.id === _this.field.value);
        setTimeout(() => {_this.pubsubService.publishEvent(_this.field.eventName, {origin: _this.field.name, index: _this.field.index, valueSet: _this.field.fullValueSet, data: _this.field.value.id, type: 'combobox'})}, 50); 
    }

      // load the initial bank list
    _this.filteredItems.next(_this.field.options.slice());
    
    // listen for search field value changes
    _this.itemFilterCtrl.valueChanges
      .pipe(takeUntil(_this._onDestroy))
      .subscribe(() => {
        _this.filterItems();
      });
  }

  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  setOptions(options: any[]) {
    this.field.options = options;
    this.filteredItems.next(this.field.options.slice());
  }

  onSelection(event: any) {
    if (event.value != null && this.field.eventName != null) {
        this.pubsubService.publishEvent(this.field.eventName, {origin: this.field.name, index: this.field.index, valueSet: this.field.fullValueSet, data: event.value.id, type: 'combobox'}); 
    }
  }


  private filterItems() {
    if (!this.field.options) {
      return;
    }
    // get the search keyword
    let search = this.itemFilterCtrl.value;
    if (!search) {
      this.filteredItems.next(this.field.options.slice());
      return;
    } else {
      search = search.toLowerCase();
    }
    // filter the banks
    this.filteredItems.next(
      this.field.options.filter(item => item.name.toLowerCase().indexOf(search) > -1)
    );
  }
}
