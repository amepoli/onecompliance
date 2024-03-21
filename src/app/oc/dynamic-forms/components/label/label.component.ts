import { Component, OnInit } from "@angular/core";
import { UntypedFormGroup } from "@angular/forms";
import { FieldConfig } from 'app/oc/interfaces';
@Component({
  selector: "app-label",
  template: `
  <div *ngIf="field.isVisible != false" [ngStyle]="{ 'padding': '8px', 'background-color': field.style?.background_color ? field.style.background_color : 'transparent', 'border-radius':'4px', 'width': '100%'}" appearance="outline" [formGroup]="group">
    <mat-label [ngStyle]="{ 'color': field.style?.font_color ? field.style.font_color: 'black' , 'font-size': field.style?.font_size ? field.style.font_size : '1em', 'font-style': field.style?.font_style ? field.style.font_style : 'normal', 'font-weight': field.style?.font_weight ? field.style.font_weight : 'normal'}" [matTooltip]="field.tooltip">
      {{field | octranslate}}
    </mat-label>
  </div>
  `,
  //'padding': '8px', 'margin-bottom': '1.34375em', 'margin-top': '1.34375em', 
  styles: [`
    :host ::ng-deep .mat-form-field-wrapper {
      padding-bottom: 2px !important;
    }
  `],
  host: {
    '[style.margin-top.px]': 'field.isVisible? "8": "0"',
    '[style.margin-bottom.px]': 'field.isVisible? "8": "0"',
    '[style.margin-right]': 'field.isVisible? "0.5%": "0"',
    '[style.margin-left]': 'field.isVisible? "0.5%": "0"',
    '[style.width]': 'field.isVisible? field.width + "%": "0"',
    // '[style.padding-top.px]': 'field.isVisible? "8px": "0"',
    // '[style.padding-bottom.px]': 'field.isVisible? "8px": "0"',
  }
})
export class LabelComponent implements OnInit {
  field: FieldConfig;
  group: UntypedFormGroup;

  constructor() { }
  ngOnInit() { }
}
