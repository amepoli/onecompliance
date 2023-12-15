import { Component, OnInit, OnChanges, ViewChildren, QueryList } from '@angular/core';
import { UntypedFormGroup, UntypedFormControl } from '@angular/forms';
import { ValidationsService } from 'app/oc/services';
import { FieldConfig } from 'app/oc/interfaces';
import { SubFormDynamicFieldDirective } from 'app/oc/directives/subform-dynamic-field.directive';

@Component({
  selector: 'app-subform',
  template: `
    <div class="subform-style" [style.border-radius]="'4px'" [style.background-color]="style.background_color" 
    [style.padding]="style.padding" *ngIf="field.isVisible != false">
        <ng-container *ngFor='let subfield of field.subform; trackBy:trackItems' subformDynamicField [field]="subfield" [group]="group" [readOnlyPage]="readOnlyPage">
        </ng-container>
</div>
`,
  styles: [`
    .subform-style {
      margin-right: 2%;
      margin-left: 2%;
      display: flex !important;
      flex-wrap: wrap;
      align-items: center;
      width: 96%;
    }
  `],
  host: {
    '[style.width]': '"100%"'
  }
})
export class SubformComponent implements OnInit {

  field: FieldConfig;
  group: UntypedFormGroup;
  readOnlyPage: boolean; // field.readonly overridden by page
  
  @ViewChildren(SubFormDynamicFieldDirective) dynamicFields: QueryList<SubFormDynamicFieldDirective>;

  style = {
    background_color: 'transparent',
    padding: '0px'
  };

  constructor() { }
  ngOnInit() {
    const _this = this;
    _this.field.subform.forEach(field => {
      if (field.type === 'button') {
        return;
      }
      _this.group.addControl(field.name, new UntypedFormControl(field.value, ValidationsService.bindValidations(field.validations || [])));
    });

    _this.loadStyles();
  }

  loadStyles() {
    if(this.field.style) {
      if(this.field.style.background_color) {
        this.style.background_color = this.field.style.background_color;
        this.style.padding = '4px';
      }
    }
  }

  trackItems(index: number, item: any) {
    return index;
  }
}
