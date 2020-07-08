import { Component, OnInit, Output, EventEmitter } from "@angular/core";
import { FormGroup } from "@angular/forms";
import { FieldConfig } from "../../field.interface";
import { NgxPubSubService } from "@pscoped/ngx-pub-sub";
import { DialogService } from "app/gorico/services/dialog.service";
@Component({
  selector: "app-button",
  template: `
<div [ngStyle]="{'display': 'inline-block', 'margin-right': '1%', 'margin-left': '1%', 'width': field.width+'%'}" *ngIf="field.isVisible != false" [formGroup]="group">
<button *ngIf="field.buttonIcon" mat-icon-button [disabled]="field.readonly" (click)="onClickButton()">
        <mat-icon>{{field.buttonIcon}}</mat-icon>
      </button>

<button *ngIf="!field.buttonIcon" mat-raised-button color="primary" [disabled]="field.readonly" (click)="onClickButton()">{{field.label}}</button>
</div>
`,
  styles: []
})

export class ButtonComponent implements OnInit {
  field: FieldConfig;
  group: FormGroup;

  constructor(private pubsubService: NgxPubSubService,
    private _dialogService: DialogService) { }

  onClickButton() {
    let _this = this;

    // Confirm if the user wants to perform action
    _this._dialogService.showConfimationDialog(_this.field.label ? _this.field.label : _this.field.name, "Are you sure you want to perform this action?", "Yes", "No", "info").then((result) => {
      if (result.value === true) {
        // User clicked yes
        if (_this.field.eventName !== null) {
          _this.pubsubService.publishEvent(_this.field.eventName, { origin: _this.field.name, index: _this.field.index, valueSet: _this.field.fullValueSet, data: '', type: 'button_click' }); // provide index in case of multiple instances of the button
        }
      }
    });
  }

  ngOnInit() { }
}
