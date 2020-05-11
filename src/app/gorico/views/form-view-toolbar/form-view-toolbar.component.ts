import { Component, ViewChild, Input, Output, EventEmitter, OnChanges, OnInit } from '@angular/core';

import 'rxjs/add/operator/filter';
import { BackendService } from '../backend/backend.service';
import { MatDialog } from '@angular/material';
import { TabType } from '../../bottom-tabs/bottom-tabs.component';
import { AttachDialogComponent } from 'app/gorico/dialogs/attach.dialog/attach.dialog.component';
import { FormGetterComponent, formGetterParams } from '../form-getter/form-getter.component';
import { AuthService } from 'app/gorico/login-page/auth.service';
import { ToastService } from 'app/gorico/services/toast.service';
import { DialogService } from 'app/gorico/services/dialog.service';
import { FormViewComponent } from '../form/form-view.component';

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
    selector: 'form-view-toolbar',
    templateUrl: './form-view-toolbar.component.html',
    styleUrls: ['./form-view-toolbar.component.scss']
})
export class FormViewToolbarComponent implements OnChanges, OnInit {

    @Input() formView: FormViewComponent = null;
    @Input() showNavBar: boolean = false;
    @Input() n: number = 0;
    @Input() tot: number = 0;


    @Input() tableData: formViewParams;
    @Output() sendEvent = new EventEmitter<any>();

    @ViewChild(FormGetterComponent) formGetter: FormGetterComponent;


    readOnly = false;

    tabKeys: tabViewKey[]; // view tab fields as specified by the backend

    currentKeys: any; // relevant keys passed by the child component 

    getterParams: formGetterParams; // params for the child formGetter form view

    savingState: savingStateType = 'save';

    constructor(public attachDialog: MatDialog,
        private backendService: BackendService,
        private authService: AuthService,
        private _dialogService: DialogService,
        private _toastService: ToastService) {

    }

    ngOnInit() {
    }

    ngOnChanges() {
        // _this.n = _this.tableData.index;
        // _this.tot = _this.tableData.total;
    }

    getTabs(tabKeys: tabViewKey[], keys: any): TabType[] {
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
                else {
                    // Show error snackbar
                    this._toastService.showErrorToast(result.reason);
                }
            }
        );
    }

    delElement() {
        var _this = this;

        // Show confirmation dialog to make sure user wants to delete
        _this._dialogService.showConfimationDialog("Delete form", "Are you sure you wanna delete form?", "Yes", "No", "warning").then((result) => {
            if (result.value === true) {
                // User said yes so let's delete form
                _this.backendService.deleteData(_this.tableData.entryName, _this.authService.getCurrentCompany(), _this.currentKeys).subscribe(
                    result => {
                        console.log(result);
                        if (result.result === 'OK') {
                            // Show success toast
                            _this._toastService.showSuccessToast("Form Deleted");

                            // navigate backward
                            _this.sendEvent.emit({ eventType: 'deletedForm' }); // notify parent
                        }
                        else {
                            // Show error snackbar
                            _this._toastService.showErrorToast(result.reason);
                        }
                    }
                );
            }
        });
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
