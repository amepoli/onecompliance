import { Component, OnInit, OnDestroy} from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { FieldConfig, Item } from '../../field.interface';
import { ReplaySubject, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
@Component({
  selector: 'combobox',
  template: `
<mat-form-field style="width:100%;" [formGroup]="group">
<mat-select [ngModel]="field.value" [formControlName]="field.name" [placeholder]="field.label">
<ngx-mat-select-search [formControl]="itemFilterCtrl" [placeholderLabel]="'Finder'"></ngx-mat-select-search>
<mat-option *ngFor="let item of filteredItems | async" [value]="item">{{item.name}}</mat-option>
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


  constructor() {}
  ngOnInit() {
    
    if (this.field.value) {
        this.field.value = this.field.options.find(x => x.id === this.field.value);
    }

      // load the initial bank list
    this.filteredItems.next(this.field.options.slice());
    
    // listen for search field value changes
    this.itemFilterCtrl.valueChanges
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
        this.filterItems();
      });
  }

  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
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
