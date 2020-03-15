import { Component, OnInit } from "@angular/core";
import { FormGroup } from "@angular/forms";
import { FieldConfig } from "../../field.interface";
import { NgxPubSubService } from '@pscoped/ngx-pub-sub';

@Component({
  selector: "app-radiobutton",
  template: `
<div [ngStyle]="{'margin-right': '2%', 'margin-left': '2%', 'width': field.width+'%'}" *ngIf="field.isVisible != false" [formGroup]="group">
<label class="radio-label-padding">{{field.label}}:</label>
<mat-radio-group [formControlName]="field.name" [ngStyle]="{'display': 'flex', 'flex-direction': 'column'}" [(ngModel)]="chosenItem">
<mat-radio-button *ngFor="let item of field.options" [value]="item" [disabled]="field.readonly" (change)="onCheck($event)" >{{item.name}}</mat-radio-button>
</mat-radio-group>
</div>
`,
  styles: []
})
export class RadiobuttonComponent implements OnInit {
  field: FieldConfig;
  group: FormGroup;

  chosenItem: any;

  constructor(private pubsubService: NgxPubSubService) {}
  ngOnInit() {
      console.log(this.field);
      this.chosenItem = this.field.options.find(o => o.id === this.field.value);
  }

  onCheck(event: any): void {
    const _this = this;

    console.log(event);

    if (_this.field.eventName !== null) {
        // wait a while before triggering the event
        setTimeout(() => {_this.pubsubService.publishEvent(_this.field.eventName, {origin: _this.field.name, index: _this.field.index, valueSet:_this.field.fullValueSet, data: event.value, type:'radiobutton'}); }, 50);
      }
  }
}
