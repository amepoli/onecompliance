import { Component, OnInit } from "@angular/core";
import { UntypedFormGroup } from "@angular/forms";
import { FieldConfig } from '../../../../oc/interfaces';

@Component({
  selector: "app-checkboxgroup",
  template: `
    <div *ngIf="field.isVisible != false">
      <div [ngStyle]="{'width': '100%'}" [formGroup]="group" *ngFor="let item of field.options; let i = index" >
        <mat-checkbox [disabled]="field.readonly || readOnlyPage" [checked]="selection[i]" (change)="onCheck(i, $event.checked)" [matTooltip]="field.tooltip"></mat-checkbox>
        <label class="checkboxgroup-label-padding">{{item.name}}</label>
      </div>
    </div>
  `,
  styles: [`
    .checkboxgroup-label-padding {
      padding-left: 4px;
    }
    :host ::ng-deep .mat-form-field-wrapper {
      padding-bottom: 2px !important;
    }
  `],
  host: {
    // '[style.padding-top.px]': 'field.isVisible? "4": "0"',
    // '[style.padding-bottom.px]': 'field.isVisible? "4": "0"',
    '[style.margin-right]': 'field.isVisible? "0.5%": "0"',
    '[style.margin-left]': 'field.isVisible? "0.5%": "0"',
    '[style.width]': 'field.isVisible? field.width + "%": "0"'
  }
})
export class CheckboxGroupComponent implements OnInit {
  field: FieldConfig;
  group: UntypedFormGroup;
  readOnlyPage: boolean; // field.readonly overridden by page

  selection: any[] = [];


  constructor() { }
  ngOnInit() {
    const _this = this;

    if (_this.field.value == null || _this.field.value.length == null) {
      _this.field.value = [];
    }
    else {
      const targetType = typeof _this.field.value[0];
      _this.field?.options?.forEach(option => {
        let id: any = option.id;
        if(typeof id !== targetType) {
          if(targetType === 'number') {
            id = parseInt(id);
          }
          else if(targetType === 'string') {
            id = '' + id;
          }
        }

        const selected: any = (_this.field.value.indexOf(id)) > -1 ? true : false;
        _this.selection.push(selected);
      });  
    }

    // _this.field.options.map(x => {
    //   return { id: x.id, checked: false }
    // });
  }

  onCheck(id: number, checked: boolean): void {
    const _this = this;

    this.selection[id] = checked ? 1 : 0;

    if(_this.field.options && _this.field.options[id]) {
      var index = _this.field.value.indexOf(_this.field.options[id].id);
  
      if (index > -1 && !checked) {  //remove an existing element from value array
        _this.field.value.splice(index, 1);
      } else if (checked && index === -1) {
        _this.field.value.push(_this.field.options[id].id);
      }

    }
  }


  public reset() {
    this.field.value = [];
  }
}

