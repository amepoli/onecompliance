import { Component, OnInit } from "@angular/core";
import { FormGroup } from "@angular/forms";
import { FieldConfig } from "../../field.interface";
@Component({
  selector: "app-checkbox",
  template: `
<div [ngStyle]="{'margin-right': '10px', 'margin-left': '10px','width': field.newLine != 'false' ? '100%' : ''}" *ngIf="field.isVisible != 'false'" [formGroup]="group" >
<mat-checkbox [ngModel]="field.value" [formControlName]="field.name">{{field.label}}</mat-checkbox>
</div>
`,
  styles: []
})
export class CheckboxComponent implements OnInit {
  field: FieldConfig;
  group: FormGroup;
  constructor() {}
  ngOnInit() {}
}
