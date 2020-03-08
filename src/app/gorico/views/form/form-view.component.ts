import { Component, ViewChild, Input, Output, EventEmitter, OnChanges, OnInit } from '@angular/core';

import 'rxjs/add/operator/filter';
import { BackendService } from '../backend/backend.service';
import { MatDialog } from '@angular/material';
import { TabType } from '../../bottom-tabs/bottom-tabs.component';
import { AttachDialogComponent } from 'app/gorico/dialogs/attach.dialog/attach.dialog.component';
import { FormGetterComponent, formGetterParams } from '../form-getter/form-getter.component';
import { AuthService } from 'app/gorico/login-page/auth.service';

type tabViewType = 'table' | 'tableForm';

type tabEventActionType = 'show' | 'hide';

type tabConditionType = 'equalTo' | 'greaterThan' | 'lessThan';

export interface tabViewKey { // as per API specification
    label: string;
    entryKey: string;
    type: tabViewType; 
    keys: [
        {
            parent: string,
            son: string
        }
    ];
    inputEvents?: [
        {
            eventName: string,
            actionType: tabEventActionType,
            condition: tabConditionType,
            values: string[]
        }
    ];
    isHidden?: boolean;
}

export interface formViewParams {
    entryName: string;
    keys: any;
    index: number;
    total: number;
    isNew: boolean;
    showNavBar: boolean;
}

type savingStateType = 'save' | 'saving' | 'done';

@Component({
    selector: 'form-view',
    templateUrl: './form-view.component.html',
    styleUrls: ['./form-view.component.scss']
})
export class FormViewComponent implements OnChanges, OnInit {

    @Input() tableData: formViewParams;
    @Output() sendEvent = new EventEmitter<any>();

    @ViewChild(FormGetterComponent) formGetter: FormGetterComponent;

    n = 0;
    tot = 0;

    readOnly = false;

    tabKeys: tabViewKey[]; // view tab fields as specified by the backend

    currentKeys: any; // relevant keys passed by the child component 

    getterParams: formGetterParams; // params for the child formGetter form view

    savingState: savingStateType = 'save';
    
    constructor(public attachDialog: MatDialog, 
        private backendService: BackendService,
        private authService: AuthService) { 
        
        }

    ngOnInit() {
        const _this = this; // useful to debug
        _this.formGetter.sendEvent.subscribe(
            event => {
                if (event.eventType === 'formData') {   // child received the view Info
                    _this.currentKeys = event.viewKeys;
                    _this.tabKeys = event.tabKeys;
                } else if (event.eventType === 'updateData') {  // child received the actual data, now time to populate subtables
                    let tabs: TabType[];
                    if (!_this.tableData.isNew && _this.tabKeys != null) {
                        // send the tabs parameter to the main view 
                        let keys = {};
                        event.data[0].forEach(e => {
                            keys[e.name] = e.value;
                        });
                        tabs = _this.getTabs(_this.tabKeys, keys);
                        _this.sendEvent.emit({ eventType: 'tabData', queryParams: { tabs: tabs } });
                    } else {
                        _this.sendEvent.emit({ eventType: 'tabData', queryParams: { tabs: null } });
                    }
                } else if (event.eventType === 'updateKeys') {
                    _this.currentKeys = event.viewKeys;
                } else if (event.eventType === 'readOnly') {
                    _this.readOnly = event.value;
                } else { // just forward the event to parent
                    _this.sendEvent.emit(event);
                }
            }
        );

    }

    ngOnChanges() {
        const _this = this; // useful to debug
        _this.getterParams = {
            entryName: _this.tableData.entryName,
            keys: _this.tableData.keys,
            isNew: _this.tableData.isNew,
            isVisible: true
        };
        _this.n = _this.tableData.index;
        _this.tot = _this.tableData.total;
        
    }

    getTabs (tabKeys: tabViewKey[], keys: any): TabType[] {
        const tabs: TabType[] = [];
        tabKeys.forEach(tabKey => {
            const tab: TabType = { 
                table: tabKey.entryKey, 
                label: tabKey.label,
                type: (tabKey.type != null && tabKey.type === 'tableForm') ? 'tableForm' : 'table',  // if not defined is a table 
                keys: {},
                inputEvents: tabKey.inputEvents,
                hidden: (tabKey.isHidden != null) ? tabKey.isHidden : false
            };
            tabKey.keys.forEach(key => {
                if (keys[key.parent]) {
                    tab.keys[key.son] = keys[key.parent];
                }
            });
            tabs.push(tab);
        });
        return tabs;
    }

    onSave() {

        // notify parent, which will take care of propagating to siblings if needed 
        this.sendEvent.emit({ eventType: 'gotSave' });
        // get the form data, assuming there is only one form
        let values = this.formGetter.formArray.first.form.value; 
        // process the booleans (1/0 instead of true/false)
        for (const value in values) {
            if (values.hasOwnProperty(value)) {
                const element = values[value];
                if (element == null) {
                    continue; // skip null entries
                }
                // decode combos
                if (element['id'] != null) {
                    values[value] = element['id'];
                }
                // encode boolean
                else if (element === true) {
                    values[value] = '1';
                } 
                else if (element === false) {
                    values[value] = '0';
                }
            }
        }

        this.savingState = 'saving';
        this.backendService.updateData(this.tableData.entryName, this.authService.getCurrentCompany(), this.currentKeys, [values]).subscribe(   // backend expects an array of data
            result => {
                console.log(result);
                if (result.result === 'OK') {
                    this.savingState = 'done';
                    setTimeout(() => {
                        this.savingState = 'save';
                        this.sendEvent.emit({ eventType: 'savedForm' }); // notify parent
                    }, 1000);
                }
            }
        );
    }

    delElement() {
        this.backendService.deleteData(this.tableData.entryName, this.authService.getCurrentCompany(), this.currentKeys).subscribe(
            result => {
                console.log(result);
                if (result.result === 'OK') {
                    // navigate backward
                    this.sendEvent.emit({ eventType: 'deletedForm' }); // notify parent
                }
            }
        )
    }

    toElement(target: string) {
        this.sendEvent.emit({ eventType: target });
    }

    showAttachments() {
        // Pop-up example
        const dialogRef = this.attachDialog.open(AttachDialogComponent, {
            width: '1280px',
            data: { entryName: this.tableData.entryName, keys: this.currentKeys }
          });
      
          dialogRef.afterClosed().subscribe(result => {
            if (result) {
                
            }
          });
    }

}
