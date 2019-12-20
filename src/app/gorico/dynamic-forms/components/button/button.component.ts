import { Component, OnInit, Output, EventEmitter } from "@angular/core";
import { FormGroup } from "@angular/forms";
import { FieldConfig } from "../../field.interface";
import { NgxPubSubService } from "@pscoped/ngx-pub-sub";
@Component({
  selector: "app-button",
  template: `
<div [ngStyle]="{'display': 'inline-block', 'margin-right': '2%', 'margin-left': '2%', 'width': field.width+'%'}" *ngIf="field.isVisible != false" [formGroup]="group">
<button mat-raised-button color="primary" (click)="onClickButton()">{{field.label}}</button>
</div>
`,
  styles: []
})

export class ButtonComponent implements OnInit {
  field: FieldConfig;
  group: FormGroup;

  constructor(private pubsubService: NgxPubSubService) {}

  onClickButton() {
    if (this.field.eventName !== null) {
        this.pubsubService.publishEvent(this.field.eventName, {origin: this.field.name, index: this.field.index, data: '', type: 'button_click'}); // provide index in case of multiple instances of the button
    }
  }

  ngOnInit() {}
}
