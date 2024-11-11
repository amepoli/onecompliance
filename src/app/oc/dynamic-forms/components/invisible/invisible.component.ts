import { Component, HostBinding, OnInit, ViewEncapsulation } from "@angular/core";
import { UntypedFormGroup } from "@angular/forms";
import { FieldConfig } from 'app/oc/interfaces';
@Component({
  selector: "app-invisible",
  template: `
<div *ngIf="field.isVisible != false" [ngStyle]="{'width': '100%'}">

</div>
`,
  styles: [`
    :host ::ng-deep .mat-form-field-wrapper {
      padding-bottom: 2px !important;
    }
  `],
  host: {
    // '[style.padding-top.px]': 'field.isVisible? "16": "0"',
    // '[style.padding-bottom.px]': 'field.isVisible? "16": "0"',
    '[style.margin-right]': 'field.isVisible? "0.5%": "0"',
    '[style.margin-left]': 'field.isVisible? "0.5%": "0"',
    '[style.width]': 'field.isVisible? field.width + "%": "0"',
    '[style.height]': 'field.isVisible? "36px": "0"'
  }
})
export class InvisibleComponent implements OnInit {
  field: FieldConfig;
  group: UntypedFormGroup;
  readOnlyPage: boolean; // field.readonly overridden by page

  constructor() { }
  ngOnInit() {
  }

}
