import { Component, OnInit } from "@angular/core";
import { FormGroup } from "@angular/forms";
import { FieldConfig } from "../../field.interface";
@Component({
  selector: "app-label",
  template: `
  <div *ngIf="field.isVisible != false" [ngStyle]="{'margin-bottom': '24px', 'margin-right': '0%', 'margin-left': '2%','width': field.width+'%'}" appearance="outline" [formGroup]="group">
  
    <mat-label [style.background-color]="field.style.background_color" [style.color]="field.style.font_color" >{{field.label}}</mat-label>
</div>
  `,
  styles: []
})
export class LabelComponent implements OnInit {
  field: FieldConfig;
  group: FormGroup;
  constructor() { }
  ngOnInit() { }
}
