import { Component, OnInit } from "@angular/core";
import { FormGroup } from "@angular/forms";
import { FieldConfig } from "../../field.interface";
import { NgxPubSubService } from '@pscoped/ngx-pub-sub';

@Component({
  selector: "app-checkboxgroup",
  template: `
    <div *ngIf="field.isVisible != false">
      <div [ngStyle]="{'margin-right': '1%', 'margin-left': '1%', 'width': field.width+'%'}" [formGroup]="group" *ngFor="let item of field.options; let i = index" >
        <mat-checkbox [disabled]="field.readonly || readOnlyPage" (change)="onCheck(item.id, $event.checked)"></mat-checkbox>
        <label class="checkboxgroup-label-padding">{{item.name}}</label>
      </div>
    </div>
  `,
  styles: [`
    .checkboxgroup-label-padding {
      padding-left: 4px;
    }
  `]
})
export class CheckboxGroupComponent implements OnInit {
  field: FieldConfig;
  group: FormGroup;
  readOnlyPage: boolean; // field.readonly overridden by page

  selection = {};


  constructor(private pubsubService: NgxPubSubService) { }
  ngOnInit() {
    const _this = this;
    console.log(_this.field);
    _this.selection = {};
    for (let i = 0; i < _this.field.options.length; i++) {
      _this.selection[_this.field.options[i].id] = 0;
    }

    // _this.field.options.map(x => {
    //   return { id: x.id, checked: false }
    // });

    // trigger an event the first time
    setTimeout(() => { _this.pubsubService.publishEvent(_this.field.eventName, { origin: _this.field.name, index: _this.field.index, valueSet: _this.field.fullValueSet, data: _this.selection, type: 'checkboxgroup' }); }, 50);
  }

  onCheck(id: any, checked: boolean): void {
    const _this = this;

    this.selection[id] = checked ? 1 : 0;
    //console.table(this.selection);
    console.log(_this.field.eventName);

    if (_this.field.eventName !== null) {
      // wait a while before triggering the event
      setTimeout(() => { _this.pubsubService.publishEvent(_this.field.eventName, { origin: _this.field.name, index: _this.field.index, valueSet: _this.field.fullValueSet, data: _this.selection, type: 'checkboxgroup' }); }, 50);
    }
  }
}
