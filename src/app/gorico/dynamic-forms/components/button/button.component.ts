import { Component, OnInit, Output, EventEmitter } from "@angular/core";
import { FormGroup } from "@angular/forms";
import { FieldConfig } from "../../field.interface";
@Component({
  selector: "app-button",
  template: `
<div [ngStyle]="{'margin-right': '5%', 'margin-left': '5%', 'width': field.width+'%'}" *ngIf="field.isVisible != false" [formGroup]="group">
<button mat-raised-button color="primary" (click)="onClickButton($event)">{{field.label}}</button>
</div>
`,
  styles: []
})

export class ButtonComponent implements OnInit {
  field: FieldConfig;
  group: FormGroup;

  constructor() {}

  onClickButton(event) {
    if (this.field.onChange !== null) {
        this.field.onChange(this.field.name);
    }
  }

  ngOnInit() {}
}
