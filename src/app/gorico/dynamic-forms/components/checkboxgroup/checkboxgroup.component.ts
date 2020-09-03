import { Component, OnInit } from "@angular/core";
import { FormGroup } from "@angular/forms";
import { FieldConfig } from "../../field.interface";
import { NgxPubSubService } from '@pscoped/ngx-pub-sub';

@Component({
  selector: "app-checkboxgroup",
  template: `
    <div *ngIf="field.isVisible != false">
      <div [ngStyle]="{'margin-right': '1%', 'margin-left': '1%', 'width': field.width+'%'}" [formGroup]="group" *ngFor="let item of field.options; let i = index" >
        <mat-checkbox [disabled]="field.readonly || readOnlyPage" [checked]="selection[i]" (change)="onCheck(i, $event.checked)"></mat-checkbox>
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

  selection = [];


  constructor(private pubsubService: NgxPubSubService) { }
  ngOnInit() {
    const _this = this;

    if (_this.field.value == null || _this.field.value.length == null) {
        _this.field.value = [];
    }
    _this.field.options.forEach (option => {
      const selected = (_this.field.value.indexOf(option.id)) > -1 ? 1 : 0;
      _this.selection.push(selected);
    });

    // _this.field.options.map(x => {
    //   return { id: x.id, checked: false }
    // });

    // trigger an event the first time
    setTimeout(() => { _this.pubsubService.publishEvent(_this.field.eventName, { origin: _this.field.name, index: _this.field.index, valueSet: _this.field.fullValueSet, data: _this.field.value, type: 'checkboxgroup' }); }, 50);
  }

  onCheck(id: number, checked: boolean): void {
    const _this = this;

    this.selection[id] = checked ? 1 : 0;

    var index = _this.field.value.indexOf(_this.field.options[id].id);

    if (index > -1 && !checked ) {  //remove an existing element from value array
       _this.field.value.splice(index, 1);
    } else if (checked && index === -1) {
       _this.field.value.push(_this.field.options[id].id);
    }

    if (_this.field.eventName !== null) {
      // wait a while before triggering the event
      setTimeout(() => { _this.pubsubService.publishEvent(_this.field.eventName, { origin: _this.field.name, index: _this.field.index, valueSet: _this.field.fullValueSet, data: _this.field.value, type: 'checkboxgroup' }); }, 50);
    }
  }
}
