import { Component, ViewChild, OnChanges, Input } from '@angular/core';
import { FormGetterComponent, formGetterParams } from '../form-getter/form-getter.component';
import { BackendService } from '../backend/backend.service';;


export interface formTableViewParams {
  entryName: string;
  keys: any;
}

@Component({
  selector: 'form-table-view',
  templateUrl: './form-table-view.component.html',
  styleUrls: ['./form-table-view.component.scss']
})

export class FormTableViewComponent implements OnChanges {

  @ViewChild(FormGetterComponent) formGetter: FormGetterComponent;

  @Input() tableData: formTableViewParams;

  currentKeys: any; // relevant keys passed by the parent component 

  getterParams: formGetterParams; // params for the child formGetter form view

  processView = false;   // handle the form-getter child view

  constructor(
    private backendService: BackendService
  ) { }

  ngOnChanges() {
    const _this = this; // useful to debug
    _this.getterParams = {
      entryName: _this.tableData.entryName,
      keys: _this.tableData.keys,
      isNew: false,
      isVisible: true  // hide the child view and handle it from parent
    };
    _this.formGetter.sendEvent.subscribe(
      event => {
        if (event.eventType === 'updateData') {   // child downloaded data
        }
      });
  }

}
