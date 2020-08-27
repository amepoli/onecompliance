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

<button *ngIf="!field.buttonIcon" mat-raised-button color="primary" [disabled]="field.readonly" (click)="onClickButton()"
[style.padding]="'4px'" [style.border-radius]="'4px'" [style.background-color]="field.style.background_color" [style.color]="field.style.font_color">{{field.label}}</button>
</div>
`,
  styles: []
})

export class ButtonComponent implements OnInit {
  field: FieldConfig;
  group: FormGroup;
  readOnlyPage: boolean;  // not used for button

  constructor(private pubsubService: NgxPubSubService,
    private _dialogService: DialogService) { }

  onClickButton() {
    const _this = this;

    // Confirm first if confirmation is true before performing action
    if (_this.field.confirmButtonAction) {
      // Show confirmation dialog
      _this._dialogService.showConfimationDialog(_this.field.label ? _this.field.label : _this.field.name, "Are you sure you want to perform this action?", "Yes", "No", "info").then((result) => {
        if (result.value === true) {
          // User clicked yes
          if (_this.field.eventName !== null) {
            _this.pubsubService.publishEvent(_this.field.eventName, { origin: _this.field.name, index: _this.field.index, valueSet: _this.field.fullValueSet, data: '', type: 'button_click' }); // provide index in case of multiple instances of the button
          }
        }
      });
    }
    else {
      // Perform action without confirmation
      if (_this.field.eventName !== null) {
        _this.pubsubService.publishEvent(_this.field.eventName, { origin: _this.field.name, index: _this.field.index, valueSet: _this.field.fullValueSet, data: '', type: 'button_click' }); // provide index in case of multiple instances of the button
      }
    }

  }

  ngOnInit() { 
      const _this = this;
    _this.field.style = _this.field.style == null ? { background_color: 'lightblue', font_color: 'black' } : _this.field.style;
    _this.field.style.background_color = _this.field.style.background_color != null ? _this.field.style.background_color : 'lightblue';
    _this.field.style.font_color = _this.field.style.font_color != null ? _this.field.style.font_color : 'black';
  }
}
