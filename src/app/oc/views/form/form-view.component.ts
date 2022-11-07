import { Component, ViewChild, Input, Output, EventEmitter, OnChanges, OnInit, OnDestroy } from '@angular/core';

import 'rxjs/add/operator/filter';
import { MatDialog } from '@angular/material/dialog';
import { AttachDialogComponent } from 'app/oc/dialogs/attach.dialog/attach.dialog.component';
import { MultiAttachmentsDialogComponent } from 'app/oc/dialogs/multi-attachments.dialog/multi-attachments.dialog.component';
import { FormGetterComponent } from '../form-getter/form-getter.component';
import { Subscription } from 'rxjs';
import { FormGetterParams, FormViewParams, MessageElement, MessageItem, MessageView, TabType, TabViewKey } from 'app/oc/interfaces';
import { ActionsService, AuthService, BackendService, ConsoleLoggerService, DialogService, DocumentationService, ImportExportService, MessagesService, NavigationService, PubSubService, ReportService, TimezoneService, ToastService } from 'app/oc/services';
import { FileManagerService } from 'app/main/apps/file-manager/file-manager.service';

type savingStateType = 'save' | 'saving' | 'done';

@Component({
    selector: 'form-view',
    templateUrl: './form-view.component.html',
    styleUrls: ['./form-view.component.scss']
})
export class FormViewComponent implements OnChanges, OnInit, OnDestroy {

    @Input() isQuickAdd: boolean = false;
    @Input() tableData: FormViewParams;
    @Output() sendEvent = new EventEmitter<any>();

    @ViewChild(FormGetterComponent, { static: true }) formGetter: FormGetterComponent;

    // toolbar pub/sub topics
    subMsgCmdTopic = '/toolbar/out/cmd';
    pubMsgCmdTopic = '/toolbar/in/cmd';

    n = 0;
    tot = 0;
    n_attach = 0;

    readOnly = false;

    tabKeys: TabViewKey[]; // view tab fields as specified by the backend

    currentKeys: any; // relevant keys passed by the child component 

    getterParams: FormGetterParams; // params for the child formGetter form view

    savingState: savingStateType = 'save';

    subscriptions: Subscription[] = [];

    hideActions: string[] = []; // Hide actions
    
    messages: MessageElement[] = []; // Messages
    @Output() onMessagesUpdated: EventEmitter<MessageView[]> = new EventEmitter();

    refreshOnSave = false;

    constructor(private pubSubService: PubSubService,
        public attachDialog: MatDialog,
        private backendService: BackendService,
        private authService: AuthService,
        private _dialogService: DialogService,
        private _toastService: ToastService,
        private _fileService: FileManagerService,
        private _pubSubService: PubSubService,
        private _reportService: ReportService,
        private _importExportService: ImportExportService,
        private _navigationService: NavigationService,
        private _messagesService: MessagesService,
        private _console: ConsoleLoggerService,
        private _actionsService: ActionsService,
        private _timezoneService: TimezoneService
    ) {

    }

    ngOnInit() {
        const _this = this; // useful to debug

        if (_this.tableData.navBarMode === 'add') {
            _this.isQuickAdd = false;
        }

        // Subscribe to Reload Request
        _this.subscriptions.push(_this._fileService.reloadNeeded.subscribe(entryName => {
            if (entryName === _this.tableData.entryName) {
                //_this.getAttachList();
            }
        }));

        // _this.backendService.sendEmailUsingTemplate('email').subscribe(
        //     result => {
        //         _this._console.log(result);
        //     },
        //     error => {
        //         _this._console.log(error);
        //     }
        // );

        const subscription = _this.formGetter.sendEvent.subscribe(
            event => {
                if (event.eventType === 'formData') {   // child received the view Info
                    _this.currentKeys = event.viewKeys;
                    _this.tabKeys = event.tabKeys;
                    _this.n_attach = 0;
                    //_this.getAttachList();
                    if(!_this._reportService.isLazyLoadingEnabled || _this._reportService.cache[_this.tableData.entryName]) {
                        _this.getReportList();
                    }
                    else {
                        _this._reportService.prepareLazyLoad(_this.tableData.entryName);
                    }

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

        _this.subscriptions.push(subscription);
        
    }

    ngOnChanges() {
        this.loadData();

    }

    ngOnDestroy() {
        this.subscriptions.forEach(element => {
            element.unsubscribe();
        });
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

    getTabs(tabKeys: TabViewKey[], keys: any): TabType[] {
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

                // Old method in which we check the whole form at once
                // This is not good because it also checks invisible fields
                // if (!form.form.valid) {
                //     isValid = false;
                // }

                form.fields.forEach(field => {
                    if (field.isVisible) {
                        if (form.form.get(field.name) && !form.form.get(field.name).valid) {
                            form.form.get(field.name).markAsTouched({ onlySelf: false });
                            isValid = false;
                        }
                    }
                });

                // if (!isValid) {
                //     // Highlight all empty required fields
                //     Object.keys(form.form.controls).forEach(field => {
                //         const control = form.form.get(field);
                //         control.markAsTouched({ onlySelf: false });
                //     });
                // }

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

        this.pubSubService.publishEvent(event.eventName, { origin: 'save_button', index: 0, valueSet: [], data: event, type: 'button_click' }); // provide index in case of multiple instances of the button


        this._console.log(event);
    }

    onSave() {
        let _this = this;
        if (_this.isFormValid()) {
            // notify parent, which will take care of propagating to siblings if needed 
            _this.sendEvent.emit({ eventType: 'gotSave' });
            // get the form data, assuming there is only one form
            let values = _this.formGetter.formArray.first.form.value;

            // process the booleans (1/0 instead of true/false)
            for (const value in values) {
                if (values.hasOwnProperty(value)) {
                    const element = values[value];
                    if (element == null) {
                        continue; // skip null entries
                    }
                    // make '' -> null
                    if (element == '') {
                        values[value] = null;
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
                    // To keep the same datetime but add timezone in the end
                    // else if(element.includes('.000' + _this._timezoneService.timezoneInfo.utc_offset)) {
                        // values[value] = element.replace('.000' + _this._timezoneService.timezoneInfo.utc_offset, '.000Z');
                    // }
                }
            }

            _this.savingState = 'saving';
            const subscription = _this.backendService.updateData(_this.tableData.entryName, _this.authService.getCurrentCompany(_this.currentKeys), _this.currentKeys, [values]).subscribe(   // backend expects an array of data
                result => {
                    _this._console.log(result);
                    if (result.result === 'OK') {
                        // Show success toast
                        _this._toastService.showSuccessToast('Saved');
                        _this.savingState = 'done';
                        setTimeout(() => {
                            _this.savingState = 'save';
                            if (_this.isQuickAdd) {
                                _this.isQuickAdd = false;
                                _this.sendEvent.emit({ eventType: 'savedForm' }); // notify parent
                            }
                            else if (_this.tableData && _this.tableData.isNew) {
                                _this.navigationToViewHome(values, result.data);
                            }
                            else if (_this.refreshOnSave) {
                                _this.isQuickAdd = false;
                                _this.refreshView();
                                _this._navigationService.requestBottomTabRefresh();
                            }
                            else {
                                _this.formGetter.runOnSaveEvents();
                                _this._navigationService.requestBottomTabRefresh();
                            }
                            
                        }, 1000);
                    }
                    else {
                        // Check if error occured during pre check
                        if(result.preErrors){
                            _this._dialogService.showErrorDialog("Error", result.preErrors.join('\n'));
                        }
                        else {
                            // Show error snackbar
                            _this._toastService.showErrorToast(result.reason);
                        }
                        _this.savingState = 'save';
                    }
                },
                error =>{
                    // Show error snackbar
                    _this._toastService.showErrorToast(error);
                    
                    _this.savingState = 'save';
                }
            );

            _this.subscriptions.push(subscription);
        }
        else {
            _this._toastService.showErrorToast("Form is not valid!");
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
                const subscription = _this.backendService.deleteData(_this.tableData.entryName, _this.authService.getCurrentCompany(_this.currentKeys), _this.currentKeys).subscribe(
                    result => {
                        _this._console.log(result);
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
                    },
                    error => {
                        _this._toastService.showErrorToast(error);
                    }
                );

                _this.subscriptions.push(subscription);
            }
        });
    }

    shareElement(azienda){
        var _this = this;
        let keys = JSON.parse(JSON.stringify(_this.currentKeys));
        keys['chosen_azienda'] = azienda;
        let entryName: string = _this.tableData.entryName;
        let company: string = _this.authService.getCurrentCompany(keys);

        _this._actionsService.performFormAction("share", this.messages, entryName, company, keys);
        
    }

    startEvent(){
        var _this = this;
        let keys = JSON.parse(JSON.stringify(_this.currentKeys));
        let entryName: string = _this.tableData.entryName;
        let company: string = _this.authService.getCurrentCompany(keys);

        _this._actionsService.performFormAction("startEvent", this.messages, entryName, company, keys);
        
    }

    stopEvent(){
        var _this = this;
        let keys = JSON.parse(JSON.stringify(_this.currentKeys));
        let entryName: string = _this.tableData.entryName;
        let company: string = _this.authService.getCurrentCompany(keys);

        _this._actionsService.performFormAction("stopEvent", this.messages, entryName, company, keys);
        
    }
    
    openDocumentation() {
        DocumentationService.openFormViewDocumentationLink(this.tableData.entryName);
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

        this.subscriptions.push(dialogRef.afterClosed().subscribe(result => {
            if (result) {

            }
        }));
    }

    showMultiAttachments() {
        // Pop-up example
        const dialogRef = this.attachDialog.open(MultiAttachmentsDialogComponent, {
            width: '1280px',
            data: { entryName: this.tableData.entryName, keys: this.currentKeys }
        });

        this.subscriptions.push(dialogRef.afterClosed().subscribe(result => {
            if (result) {

            }
        }));
    }

    getAttachList() {
        const _this = this;
        //console.table(_this.currentKeys);
        const subscription = _this.backendService.getAttachList(_this.tableData.entryName, _this.authService.getCurrentCompany(_this.currentKeys), _this.currentKeys).subscribe(
            result => {
                _this._console.log(result);
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
        _this.subscriptions.push(subscription);
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

    updateMessages(messageViews: MessageView[]) {
        this.messages = this._messagesService.getFormMessages(messageViews);
        this.onMessagesUpdated.emit(messageViews);
    }
    
}

