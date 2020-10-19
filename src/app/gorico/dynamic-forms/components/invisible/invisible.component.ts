import { Component, HostBinding, OnInit, ViewEncapsulation } from "@angular/core";
import { FormGroup } from "@angular/forms";
import { FieldConfig } from "../../field.interface";
@Component({
  selector: "app-invisible",
  template: `
<mat-form-field *ngIf="field.isVisible != false" [ngStyle]="{'width': '100%'}" [formGroup]="group">
<mat-label></mat-label>
</mat-form-field>
`,
  styles: [],
  host: {
    '[style.padding-top.px]': 'field.isVisible? "16": "0"',
    '[style.margin-right]': 'field.isVisible? "1%": "0"',
    '[style.margin-left]': 'field.isVisible? "1%": "0"',
    '[style.width]': 'field.isVisible? field.width + "%": "0"'
  }
})
export class InvisibleComponent implements OnInit {
  field: FieldConfig;
  group: FormGroup;
  readOnlyPage: boolean; // field.readonly overridden by page

  //    '[style.height.px]': 'field.isVisible? (field.textareaHeight == "l"? "206": "96"): "0"',


  constructor() { }
  ngOnInit() {
    console.log('textareaHeight:', this.field.textareaHeight);
  }

}
