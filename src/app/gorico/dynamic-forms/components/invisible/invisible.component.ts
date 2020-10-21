import { Component, HostBinding, OnInit, ViewEncapsulation } from "@angular/core";
import { FormGroup } from "@angular/forms";
import { FieldConfig } from "../../field.interface";
@Component({
  selector: "app-invisible",
  template: `
<div *ngIf="field.isVisible != false" [ngStyle]="{'width': '100%'}">

</div>
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

  constructor() { }
  ngOnInit() {
  }

}
