import { Component, OnInit, OnChanges, ViewChildren, QueryList } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { ValidationsService } from 'app/gorico/services/validations.service';
import { FieldConfig } from '../../field.interface';
import { DynamicFieldDirective } from '../dynamic-field/dynamic-field.directive';

// [ngStyle]="{'margin-right': '1%', 'margin-left': '1%', 'width': field.width+'%'}"
@Component({
  selector: 'app-subform',
  template: `
    <div class="subform-style" [style.border-radius]="'4px'" [style.background-color]="style.background_color" 
    [style.padding]="style.padding" *ngIf="field.isVisible != false">
        <ng-container *ngFor='let subfield of field.subform;' dynamicField [field]="subfield" [group]="group" [readOnlyPage]="readOnlyPage">
        </ng-container>
</div>
`,
  styles: [`
    .subform-style {
      margin-right: 2%;
      margin-left: 2%;
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      width: 96%;
    }
  `],
  host: {
    '[style.width]': '"100%"'
  }
})
export class SubformComponent implements OnInit {

  field: FieldConfig;
  group: FormGroup;
  readOnlyPage: boolean; // field.readonly overridden by page
  
  @ViewChildren(DynamicFieldDirective) dynamicFields: QueryList<DynamicFieldDirective>;

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
      _this.group.addControl(field.name, new FormControl(field.value, ValidationsService.bindValidations(field.validations || [])));
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

}
