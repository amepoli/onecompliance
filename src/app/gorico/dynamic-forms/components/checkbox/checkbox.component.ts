import { Component, OnInit } from "@angular/core";
import { FormGroup } from "@angular/forms";
import { FieldConfig } from "../../field.interface";
@Component({
  selector: "app-checkbox",
  template: `
<div [ngStyle]="{'margin-right': '5%', 'margin-left': '5%', 'width': field.width+'%'}" *ngIf="field.isVisible != false" [formGroup]="group" >
<mat-checkbox [ngModel]="field.value" [formControlName]="field.name">{{field.label}}</mat-checkbox>
</div>
`,
  styles: []
})
export class CheckboxComponent implements OnInit {
  field: FieldConfig;
  group: FormGroup;
  constructor() {}
  ngOnInit() {
      if (typeof this.field.value === 'string') {
          this.field.value = parseInt( this.field.value, 10);
      }
    }
}
