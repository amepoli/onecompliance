import { Component, OnInit } from "@angular/core";
import { FormGroup } from "@angular/forms";
import { FieldConfig } from 'app/gorico/interfaces';
@Component({
  selector: "app-label",
  template: `
  <div *ngIf="field.isVisible != false" [ngStyle]="{ 'background-color': field.style.background_color? field.style.background_color: 'transparent', 'border-radius':'4px', 'padding': '8px', 'margin-bottom': '1.34375em', 'width': '100%'}" appearance="outline" [formGroup]="group">
    <mat-label [ngStyle]="{ 'color': field.style.font_color? field.style.font_color: 'black' , 'font-size': field.style.font_size? field.style.font_size: '1em', 'font-style': field.style.font_style? field.style.font_style: 'normal', 'font-weight': field.style.font_weight? field.style.font_weight: 'normal'}">
      {{field.label}}
    </mat-label>
  </div>
  `,
  styles: [],
  host: {
    '[style.margin-right]': 'field.isVisible? "1%": "0"',
    '[style.margin-left]': 'field.isVisible? "1%": "0"',
    '[style.width]': 'field.isVisible? field.width + "%": "0"'
  }
})
export class LabelComponent implements OnInit {
  field: FieldConfig;
  group: FormGroup;

  constructor() { }
  ngOnInit() { }
}
