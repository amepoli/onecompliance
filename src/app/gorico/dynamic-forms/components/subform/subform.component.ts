import { Component, OnInit, OnChanges} from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { FieldConfig } from '../../field.interface';


@Component({
  selector: 'app-subform',
  template: `
    <div [ngStyle]="{'margin-right': '1%', 'margin-left': '1%', 'width': field.width+'%'}" *ngIf="field.isVisible != false">
        <ng-container *ngFor='let subfield of field.subform;' dynamicField [field]="subfield" [group]="group" [readOnlyPage]="readOnlyPage">
        </ng-container>
</div>
`,
  styles: []
})
export class SubformComponent implements OnInit {

  field: FieldConfig;
  group: FormGroup;
  readOnlyPage: boolean; // field.readonly overridden by page

  constructor() {}
  ngOnInit()  {
    const _this = this;
    _this.field.subform.forEach(field => {
        if (field.type === 'button') {
            return;
        }
        _this.group.addControl(field.name, new FormControl(field.value, _this.bindValidations(field.validations || [])));  
    });
  }

  bindValidations(validations: any) {
    if (validations.length > 0) {
      const validList = [];
      validations.forEach(valid => {
        validList.push(valid.validator);
      });
      return Validators.compose(validList);
    }
    return null;
  }
}
