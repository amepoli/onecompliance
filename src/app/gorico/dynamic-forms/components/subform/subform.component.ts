import { Component, OnInit, OnChanges } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { ValidationsService } from 'app/gorico/services/validations.service';
import { FieldConfig } from '../../field.interface';

// [ngStyle]="{'margin-right': '1%', 'margin-left': '1%', 'width': field.width+'%'}"
@Component({
  selector: 'app-subform',
  template: `
    <div class="subform-style" *ngIf="field.isVisible != false">
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

  constructor() { }
  ngOnInit() {
    const _this = this;
    _this.field.subform.forEach(field => {
      if (field.type === 'button') {
        return;
      }
      _this.group.addControl(field.name, new FormControl(field.value, ValidationsService.bindValidations(field.validations || [])));
    });
  }


}
