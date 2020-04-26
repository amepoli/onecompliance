import { Component, OnInit } from "@angular/core";
import { FormGroup } from "@angular/forms";
import { FieldConfig } from "../../field.interface";
@Component({
  selector: "app-textarea",
  template: `
<mat-form-field *ngIf="field.isVisible != false" [ngStyle]="{'margin-right': '1%', 'margin-left': '1%','width': field.width+'%'}" appearance="outline" [formGroup]="group">
<mat-label>{{field.label}}</mat-label>
<textarea matInput [formControlName]="field.name" [readonly]="field.readonly" matTextareaAutosize matAutosizeMinRows="1" matAutosizeMaxRows="5"></textarea>
<ng-container *ngFor="let validation of field.validations;" ngProjectAs="mat-error">
<mat-error *ngIf="group.get(field.name).hasError(validation.name)">{{validation.message}}</mat-error>
</ng-container>
</mat-form-field>
`,
  styles: []
})
export class TextAreaComponent implements OnInit {
  field: FieldConfig;
  group: FormGroup;
  constructor() {}
  ngOnInit() {}
}
