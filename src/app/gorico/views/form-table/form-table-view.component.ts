import { Component, ViewChild, OnChanges, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormGetterComponent, formGetterParams } from '../form-getter/form-getter.component';
import { BackendService } from '../backend/backend.service';




export interface formTableViewParams {
  entryName: string;
  keys: any;
}

@Component({
  selector: 'form-table-view',
  templateUrl: './form-table-view.component.html',
  styleUrls: ['./form-table-view.component.scss']
})

export class FormTableViewComponent implements OnChanges, OnInit {

  @ViewChild(FormGetterComponent) formGetter: FormGetterComponent;

  @Input() tableData: formTableViewParams;
  @Input() SaveData: boolean;
  @Output() sendEvent = new EventEmitter<any>();

  currentKeys: any; // relevant keys passed by the parent component 

  getterParams: formGetterParams; // params for the child formGetter form view

  processView = false;   // handle the form-getter child view

  constructor(
    private backendService: BackendService
  ) { }

  ngOnInit() {
    const _this = this; 
    _this.formGetter.sendEvent.subscribe(
        event => {
          if (event.eventType === 'updateData') {   // child downloaded data
          }  else { // just forward the event to parent
              _this.sendEvent.emit(event);
          }
        });
  }

    ngOnChanges(changes) {
        const _this = this; // useful to debug
        if (changes.tableData) {
            _this.getterParams = {
                entryName: _this.tableData.entryName,
                keys: _this.tableData.keys,
                isNew: false,
                isVisible: true  // hide the child view and handle it from parent
            };
        } else if (changes.SaveData) {
            console.log('received save command');
        }
    
  }

}
