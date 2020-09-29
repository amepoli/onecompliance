import { Component, OnInit, ViewEncapsulation } from "@angular/core";
import { FormGroup } from "@angular/forms";
import { FieldConfig } from "../../field.interface";
@Component({
  selector: "app-textarea",
  template: `
<mat-form-field *ngIf="field.isVisible != false" [ngStyle]="{'width': '100%'}" appearance="outline" [formGroup]="group">
<mat-label>{{field.label}}</mat-label>
<textarea [ngClass]="{'text-area-extended': field.textarea_height == 'extended', 'text-area-normal': field.textarea_height != 'extended'}" matInput [formControlName]="field.name" [readonly]="field.readonly || readOnlyPage" matTextareaAutosize matAutosizeMinRows="1" matAutosizeMaxRows="5"></textarea>
<ng-container *ngFor="let validation of field.validations;" ngProjectAs="mat-error">
<mat-error *ngIf="group.get(field.name).hasError(validation.name)">{{validation.message}}</mat-error>
</ng-container>
</mat-form-field>
`,
  styles: [`
    .text-area-normal {
      min-height: 18px !important;
      max-height: 18px !important;
      height: 18px !important;
    }
    
    .text-area-extended {
      min-height: 128px !important;
      max-height: 128px !important;
      height: 128px !important;
    }

  `],
  host: {
    '[style.padding-top.px]': 'field.isVisible? "16": "0"',
    '[style.margin-right]': 'field.isVisible? "1%": "0"',
    '[style.margin-left]': 'field.isVisible? "1%": "0"',
    '[style.width]': 'field.isVisible? field.width + "%": "0"',
    '[style.height.px]': 'field.isVisible? (field.textarea_height == "extended"? "206": "96"): "0"',
  }
})
export class TextAreaComponent implements OnInit {
  field: FieldConfig;
  group: FormGroup;
  readOnlyPage: boolean; // field.readonly overridden by page

  height: '48px';

  constructor() { }
  ngOnInit() {
    console.log('textarea_height:', this.field.textarea_height);
  }
}
