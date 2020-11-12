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
import { FileManagerService } from 'app/main/apps/file-manager/file-manager.service';
import { NgxPubSubService } from '@pscoped/ngx-pub-sub';
import { ReportService } from 'app/gorico/services/report.service';
import { ImportExportService } from 'app/gorico/services/import_export.service';
import { HideAction, NavigationService } from 'app/gorico/services/navigation.service';
import { MessageView, MessagesService, MessageElement, MessageItem } from 'app/gorico/services/messages.service';

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
    navBarMode: string;
}

type savingStateType = 'save' | 'saving' | 'done';

@Component({
    selector: 'form-view',
    templateUrl: './form-view.component.html',
    styleUrls: ['./form-view.component.scss']
})
export class FormViewComponent implements OnChanges, OnInit {

    @Input() isQuickAdd: boolean = false;
    @Input() tableData: formViewParams;
    @Output() sendEvent = new EventEmitter<any>();

    @ViewChild(FormGetterComponent) formGetter: FormGetterComponent;

    // toolbar pub/sub topics
    subMsgCmdTopic = '/toolbar/out/cmd';
    pubMsgCmdTopic = '/toolbar/in/cmd';

    n = 0;
    tot = 0;
    n_attach = 0;

    readOnly = false;

    tabKeys: tabViewKey[]; // view tab fields as specified by the backend

    currentKeys: any; // relevant keys passed by the child component 

    getterParams: formGetterParams; // params for the child formGetter form view

    savingState: savingStateType = 'save';

    hideActions: string[] = []; // Hide actions
    @Output() onHideActionsUpdated: EventEmitter<HideAction[]> = new EventEmitter();

    messages: MessageElement[] = []; // Messages
    @Output() onMessagesUpdated: EventEmitter<MessageView[]> = new EventEmitter();

    refreshOnSave = true;

    constructor(private pubsubService: NgxPubSubService,
        public attachDialog: MatDialog,
        private backendService: BackendService,
        private authService: AuthService,
        private _dialogService: DialogService,
        private _toastService: ToastService,
        private _fileService: FileManagerService,
        private _pubSubService: NgxPubSubService,
        private _reportService: ReportService,
        private _importExportService: ImportExportService,
        private _navigationServce: NavigationService,
        private _messagesService: MessagesService
    ) {

    }

    ngOnInit() {
        const _this = this; // useful to debug

        if (_this.tableData.navBarMode === 'add') {
            _this.isQuickAdd = true;
        }

        // Subscribe to Reload Request
        _this._fileService.reloadNeeded.subscribe(entryName => {
            if (entryName === _this.tableData.entryName) {
                _this.getAttachList();
            }
        });

        _this.formGetter.sendEvent.subscribe(
            event => {
                if (event.eventType === 'formData') {   // child received the view Info
                    _this.currentKeys = event.viewKeys;
                    _this.tabKeys = event.tabKeys;
                    _this.n_attach = 0;
                    _this.getAttachList();
                    _this.getReportList();

                } else if (event.eventType === 'updateData' && !_this.isQuickAdd) {  // child received the actual data, now time to populate subtables
                    let tabs: TabType[];
                    if (!_this.tableData.isNew && _this.tabKeys != null) {
                        // send the tabs parameter to the main view 
                        let keys = {};
                        if (event.data[0] != null) {
                            event.data[0].forEach(e => {
                                keys[e.name] = e.value;
                            });
                        }
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
        this.loadData();

    }

    public loadData() {
        this.getterParams = null;
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

    public refreshView() {
        this.formGetter.refreshView();
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

    isFormValid() {
        let isValid = true;
        if (this.formGetter.formArray && this.formGetter.formArray.length) {
            this.formGetter.formArray.forEach(form => {
                if (!form.form.valid) {
                    isValid = false;
                    // Highlight all empty required fields
                    Object.keys(form.form.controls).forEach(field => {
                        const control = form.form.get(field);
                        control.markAsTouched({ onlySelf: true });
                    });
                }
            });
        }
        return isValid;
    }

    navigationToViewHome(values, data) {
        let event = {
            actionType: 'navigate',
            eventName: 'navigate_on_save_button',
            actionTarget: {
                name: this.tableData.entryName,
                type: 'form',
                keymap: Object.keys(this.currentKeys).map(key => { return { destination: key, source: key } })
            },
            values: values
        };

        if (data && data.length && data[0] && data[0].length && data[0][0]) {
            Object.keys(data[0][0]).forEach(key => {
                values[key] = data[0][0][key];
            })
        }

        this.pubsubService.publishEvent(event.eventName, { origin: 'save_button', index: 0, valueSet: [], data: event, type: 'button_click' }); // provide index in case of multiple instances of the button


        console.log(event);
    }

    onSave() {
        if (this.isFormValid()) {
            // notify parent, which will take care of propagating to siblings if needed 
            this.sendEvent.emit({ eventType: 'gotSave' });
            // get the form data, assuming there is only one form
            let values = this.formGetter.formArray.first.form.value;

            // process the booleans (1/0 instead of true/false)
            for (const value in values) {
                if (values.hasOwnProperty(value)) {
                    const element = values[value];
                    console.log(element);
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
                        // Show success toast
                        this._toastService.showSuccessToast('Saved');
                        this.savingState = 'done';
                        setTimeout(() => {
                            this.savingState = 'save';
                            if (this.isQuickAdd) {
                                this.navigationToViewHome(values, result.data);
                            }
                            else if (this.refreshOnSave) {
                                this.refreshView();
                            }
                            // this.sendEvent.emit({ eventType: 'savedForm' }); // notify parent
                        }, 1000);
                    }
                    else {
                        // Show error snackbar
                        this._toastService.showErrorToast(result.reason);
                        this.savingState = 'save';
                    }
                }
            );
        }
        else {
            this._toastService.showErrorToast("Form is not valid!");
        }
    }


    getDeleteMessage() {
        let result: MessageItem = {
            title: "Delete form",
            text: "Are you sure you wanna delete form?"
        };
        if (this.messages != null && this.messages.length) {
            let deleteMessageElements = this.messages.filter(m => m.messageType === "delete");
            if (deleteMessageElements && deleteMessageElements.length) {
                result.title = deleteMessageElements[0].message.title;
                result.text = deleteMessageElements[0].message.text;
            }
        }
        return result;
    }

    delElement() {
        var _this = this;
        let deleteMessage: MessageItem = _this.getDeleteMessage();

        // Show confirmation dialog to make sure user wants to delete
        _this._dialogService.showConfimationDialog(deleteMessage.title, deleteMessage.text, "Yes", "No", "warning").then((result) => {
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

    getAttachList() {
        let _this = this;
        //console.table(_this.currentKeys);
        _this.backendService.getAttachList(_this.tableData.entryName, _this.authService.getCurrentCompany(), _this.currentKeys).subscribe(
            result => {
                console.log(result);
                if (result.result === 'OK') {
                    let listFiles = result.list;
                    const files = [];
                    if (listFiles) {
                        _this.n_attach = listFiles.length;
                        listFiles.forEach(element => {
                            const file = {
                                'name': element.client_file_name,
                                'type': 'document',
                                'owner': element.autore,
                                'size': _this._fileService.getFileSize(element.dimensione),
                                'modified': new Date(element.data_upd).toString(),
                                'opened': new Date(element.data_ins).toString(),
                                'created': new Date(element.data_creazione).toString(),
                                'extention': '',
                                'location': '',
                                'offline': true
                            };
                            files.push(file);
                        });
                    }
                    _this._fileService.files = files;
                    _this._fileService.getFiles();
                }
                else {
                    // Show error snackbar
                    _this._toastService.showErrorToast(result.reason);
                }
            });
    }

    getReportList() {
        // Request to load reports
        // this._pubSubService.publishEvent(this.pubMsgCmdTopic, { type: 'print_list' });
        this._reportService.requestReload(this.tableData.entryName);
    }

    getExportList() {
        // Request to load advanced export list
        // this._importExportService.requestReload(this.tableData.entryName);
    }

    updateHideActions(hideActions: HideAction[]) {
        this.hideActions = this._navigationServce.getFormHideActions(hideActions);
        this.onHideActionsUpdated.emit(hideActions);
    }

    updateMessages(messageViews: MessageView[]) {
        this.messages = this._messagesService.getFormMessages(messageViews);
        this.onMessagesUpdated.emit(messageViews);
    }
}

