import { Component, Input, Output, EventEmitter, OnChanges, ViewChildren, QueryList, AfterViewInit, OnDestroy, SimpleChanges, ChangeDetectorRef, ViewChild } from '@angular/core';
import { DynamicFormComponent } from 'app/oc/dynamic-forms/components/dynamic-form/dynamic-form.component';
import { ComboboxComponent } from 'app/oc/dynamic-forms/components/combobox/combobox.component';
import { forkJoin, Subscription } from 'rxjs';
import { SubformComponent } from 'app/oc/dynamic-forms/components/subform/subform.component';
import { EmailActionParameters, ExportItem, FieldConfig, FormGetterParams, FormViewKey, GoogleAPIParams, ImportItem, MessageView, OutputEvent, WidgetsConfigurations } from 'app/oc/interfaces';
import { FormDataType } from 'app/oc/types';
import { AuthService, BackendService, ConsoleLoggerService, DialogService, GoogleAPIService, HelperService, ImportExportService, NavigationService, PubSubService, TimeTrackerService, ToastService, ValidationsService } from 'app/oc/services';
import { DynamicFieldDirective } from 'app/oc/directives';
import { SubFormDynamicFieldDirective } from 'app/oc/directives/subform-dynamic-field.directive';
import { InputComponent } from 'app/oc/dynamic-forms/components/input/input.component';
import { RegulatAPIParams } from 'app/oc/interfaces/regulat_api_params';
import { exit } from 'process';
import { MatDialog } from '@angular/material/dialog';
import { MenuOptionsCustomDialogComponent } from 'app/oc/dialogs/menu-options-custom.dialog/menu-options-custom.dialog.component';

@Component({
    selector: 'form-getter',
    templateUrl: './form-getter.component.html',
    styleUrls: ['./form-getter.component.scss']
})
export class FormGetterComponent implements OnChanges, AfterViewInit, OnDestroy {

    // Is form-getter inside a tab
    @Input() isTabMode: boolean = false;

    // Is form-getter part of form-view
    @Input() isFormView: boolean = false;

    // Is form-getter part of dialog form-view
    @Input() isDialog: boolean = false;

    @Input() filter: string;
    @Input() formParams: FormGetterParams = null;
    @Output() sendEvent = new EventEmitter<any>();
    @Output() onReload = new EventEmitter<any>();

    // Keys that are provided by external source and are passed to the values in onSave function
    @Input () externalKeys: object = {};

    @ViewChildren(DynamicFormComponent) formArray: QueryList<DynamicFormComponent>;

    // Contains form Data
    filteredFormData: FieldConfig[][];
    quickAddData: boolean[];

    isLoading = false;
    isAddingNew = false;

    isReadOnly = false;

    hiddenRows: boolean[] = [];

    readonlyRows: boolean[] = [];

    hideActions: string[] = [];

    importList: ImportItem[] = [];
    exportList: ExportItem[] = [];


    numRows = 1;

    @Output() onMessagesUpdated: EventEmitter<MessageView[]> = new EventEmitter();

    isAuthorized: boolean = true;
    viewKeys: FormViewKey[]; // view form fields as specified by the backend
    formRowProperties: any[];
    businessObjectName: string = null;

    currentKeys: any; // relevant keys passed by the parent component 

    outputEvents: OutputEvent[]; // event to be published to PubSub after (re)loading the table values
    // eventTrigger: string = null;

    formSubscriptions: Subscription[] = [];
    generalSubscriptions: Subscription[] = [];

    results: any[] = null;

    attributes: any[] = null;

    private addingNew = false;   // avoid to trigger a refresh (with related events) when adding a row  

    private margins = 2; // % of margins, considering left and right

    private pagination = {
        curPage: 1,
        curRecords: [],
        totalPages: 1
    };

    private recordsPerPage = 10000;

    widgetsConfiguration: WidgetsConfigurations = {
        attachments: {
            onSaveAction: 'reload'
        }
    };


    constructor(
        private cdRef: ChangeDetectorRef,
        private backendService: BackendService,
        private pubSubService: PubSubService,
        private authService: AuthService,
        private _toastService: ToastService,
        private _dialogService: DialogService,
        private _importExportService: ImportExportService,
        private _navigationService: NavigationService,
        private _console: ConsoleLoggerService,
        private _timeTrackerService: TimeTrackerService,
        private _googleAPIService: GoogleAPIService,
        public cutomDialog: MatDialog,
    ) {
        const _this = this;

    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.filter && this.results && this.results.length) {
            this.applyFilter();
        }
        // Make sure params are different before refreshing view
        // if (!this.addingNew && changes.formParams && this.formParams) {
        //     if (!changes.formParams.previousValue || (JSON.stringify(changes.formParams.previousValue) !== JSON.stringify(changes.formParams.currentValue))) {
        //         this.refreshView();
        //     }
        // } else {
        //     this.addingNew = false;
        // }
        if (changes.formParams && this.formParams) {
            if (!this.addingNew) {
                if (!changes.formParams.previousValue || (JSON.stringify(changes.formParams.previousValue) !== JSON.stringify(changes.formParams.currentValue))) {
                    // unsubscribe and then subscribe again
                    this.formSubscriptions.forEach(subscription => {
                        subscription.unsubscribe();
                    });
                    this.refreshView(true);
                }
            }
            else {
                this.addingNew = false;
            }
        }
        // else {
        //     this.clearForm();
        // }
    }

    ngAfterViewInit() {
        const _this = this;
        // check and in case publish a table event on PubSub
        let subscription = _this.formArray.changes.subscribe(
            c => {
                // run events based on form state
                if (_this.formParams && _this.formArray.length) {
                    // If adding new, run on Add New Events
                    if (_this.formParams.isNew) {
                        _this.runOnAddNewEvents();
                    }
                    // otherwise, run on Reload Events
                    else {
                        _this.runOnReloadEvents();
                    }
                }
            }
        );
        _this.generalSubscriptions.push(subscription);


        if (_this.isFormView && !_this.isTabMode) {
            subscription = _this.pubSubService.subscribe('navigate_on_save_button',
                value => {
                    _this.eventCallback(value.data, value, null); // null as keyListener means that the full table is affected
                });
            _this.generalSubscriptions.push(subscription);
        }
        console.log(_this.externalKeys);

    }

    ngOnDestroy() {
        this.generalSubscriptions.forEach(subscription => {
            subscription.unsubscribe();
        });

        this.formSubscriptions.forEach(subscription => {
            subscription.unsubscribe();
        });
    }

    public resetPagination() {
        if (this.filteredFormData && this.filteredFormData.length) {
            this.pagination = {
                curPage: 1,
                curRecords: [],
                totalPages: Math.ceil(this.filteredFormData.length / this.recordsPerPage)
            };
            this.updatePagination(0);
        }
        else {
            this.pagination = {
                curPage: 1,
                curRecords: [],
                totalPages: 1
            };
        }
    }

    public updatePagination(pageInc: number = 0) {
        let curPage = (this.pagination.curPage + pageInc > 0 && this.pagination.curPage + pageInc <= this.pagination.totalPages) ? this.pagination.curPage + pageInc : this.pagination.curPage;

        let start = (curPage - 1) * this.recordsPerPage;
        let end = Math.min(this.filteredFormData.length, start + this.recordsPerPage);

        let curRecords = [];
        for (let i = start; i < end; i++) {
            curRecords = [...curRecords, i];
        }

        //let curRecords = Array(Math.min(this.recordsPerPage,  + ).map((v, i) => ((this.pagination.curPage -1) * this.pagination.recordsPerPage) + i);
        this.pagination.curPage = curPage;
        this.pagination.curRecords = curRecords;

    }

    public runOnAddNewEvents() {
        if (this.outputEvents != null && this.outputEvents.length) {
            for (let i = 0; i < this.outputEvents.length; i++) {
                const outputEvent = this.outputEvents[i];
                if (!outputEvent.eventTrigger || outputEvent.eventTrigger === 'onAddNew') {
                    this.pubSubService.publishEvent(outputEvent.eventName, { origin: 'table', index: 0, data: this.filteredFormData, type: 'page' });
                }
            }
        }
    }

    public runOnReloadEvents() {
        if (this.outputEvents != null && this.outputEvents.length) {
            for (let i = 0; i < this.outputEvents.length; i++) {
                const outputEvent = this.outputEvents[i];
                if (!outputEvent.eventTrigger || outputEvent.eventTrigger === 'onReload') {
                    this.pubSubService.publishEvent(outputEvent.eventName, { origin: 'table', index: 0, data: this.filteredFormData, type: 'page' });
                }
            }
        }
    }

    public runOnSaveEvents() {
        if (this.outputEvents != null && this.outputEvents.length) {
            for (let i = 0; i < this.outputEvents.length; i++) {
                const outputEvent = this.outputEvents[i];
                if (!outputEvent.eventTrigger || outputEvent.eventTrigger === 'onSave') {
                    this.pubSubService.publishEvent(outputEvent.eventName, { origin: 'table', index: 0, data: this.filteredFormData, type: 'page' });
                }
            }
        }
    }

    public showErrorToast(reason : any) {
        this._toastService.showErrorToast(
            "Error " ,
            reason.detail == undefined ? '' : JSON.stringify(reason.detail) + (reason.hint == undefined ? '' : JSON.stringify(reason.hint)),
            5000,
            true
        );
    }

    refreshView(reloadEvents: boolean = true) {
        const _this = this;
        _this.isLoading = true;
        if(!_this.isDialog) {
            _this.sendEvent.emit({ eventType: 'searchKeys', queryParams: { keys: null } }); // pass search keys to parent view 
        }

        const subscription = _this.backendService.getView(_this.formParams.entryName, _this.authService.getCurrentCompany(_this.currentKeys), _this.formParams.keys).subscribe(
            results => {
                _this._console.log(results);
                if (results.result === 'OK') {
                    const params = results.data;
                    _this.viewKeys = params.form_keys;
                    if (_this.viewKeys == null) {
                        return;                         // no formKeys defined for the table, stop here
                    }
                    _this.businessObjectName = params.businessObjectName;

                    // Load Hide actions if available
                    _this.hideActions = _this._navigationService.getFormHideActions(params.hideActions);

                    // Profile hide actions
                    if (params.profileHideActions) {
                        _this.hideActions = _this.hideActions.concat(params.profileHideActions);
                    }

                    // Load Import Queries list if available
                    if (params.importQueries && params.importQueries.formQueries) {
                        _this.importList = params.importQueries.formQueries;
                    }
                    else {
                        _this.importList = [];
                    }

                    // Load Export Queries list if available
                    if (params.exportQueries && params.exportQueries.formQueries) {
                        _this.exportList = params.exportQueries.formQueries;
                    }
                    else {
                        _this.exportList = [];
                    }

                    if (_this.isFormView && !_this.isTabMode && !_this.isDialog) {

                        // Load Import Queries list if available
                        if (params.importQueries && params.importQueries.formQueries) {
                            _this._console.log('importQueries', params.importQueries);
                            _this._importExportService.updateImportList(_this.formParams.entryName, params.importQueries.formQueries);
                        }
                        else {
                            _this._importExportService.updateImportList(_this.formParams.entryName, []);
                        }

                        // Load Export Queries list if available
                        if (params.exportQueries && params.exportQueries.formQueries) {
                            _this._console.log('exportQueries', params.exportQueries);
                            _this._importExportService.updateExportList(_this.formParams.entryName, params.exportQueries.formQueries);
                        }
                        else {
                            _this._importExportService.updateExportList(_this.formParams.entryName, []);
                        }

                        // Load Hide actions if available
                        _this._navigationService.updateToolbarHideActions(_this.hideActions);

                        // Load Messages if available
                        if (params.messages) {
                            _this._console.log(params.messages);
                            _this.onMessagesUpdated.emit(params.messages);
                        }
                        else {
                            _this.onMessagesUpdated.emit([]);
                        }
                    }


                    // signal toolbar about a dashboard 
                    _this._navigationService.onDashboardTableLoad.emit({ origin: _this.formParams.entryName, dashboardTables: params.dashboardTables });

                    // Get View properties if exist
                    _this.formRowProperties = params.formRowProperties;
                    if (_this.formRowProperties && _this.formRowProperties.length) {
                        for (let i = 0; i < _this.formRowProperties.length; i++) {
                            const formRowProperty = _this.formRowProperties[i];
                            // Subscribe to all the input Events
                            if (formRowProperty.inputEvents && formRowProperty.inputEvents.length) {
                                for (let j = 0; j < formRowProperty.inputEvents.length; j++) {
                                    const event = formRowProperty.inputEvents[j];
                                    const subcription = _this.pubSubService.subscribe(event.eventName,
                                        value => {
                                            _this.eventCallback(event, value, null); // null as keyListener means that the full table is affected
                                        });
                                    _this.formSubscriptions.push(subcription);
                                }
                            }
                        }
                    }

                    _this.currentKeys = _this.getCurrentKeys(_this.viewKeys, _this.formParams.keys);
                    _this.sendEvent.emit({ eventType: 'formData', queryParams: { label: params.label }, viewKeys: _this.currentKeys, tabKeys: params.subTables });
                   if(!_this.isTabMode && !_this.isDialog)
                   {
                       _this.sendEvent.emit({ eventType: 'currentTableLabel', queryParams: { label: params.label } }); // pass current label to parent view 
                   }
                 
                    // handle input events
                    if (reloadEvents) {
                        if (params.inputEvents != null) {  // subscribe to global table events
                            for (let i = 0; i < params.inputEvents.length; i++) {
                                const event = params.inputEvents[i];
                                const subcription = _this.pubSubService.subscribe(event.eventName,
                                    value => {
                                        
                                        _this.eventCallback(event, value, null); // null as keyListener means that the full table is affected
                                    });
                                _this.formSubscriptions.push(subcription);
                            }
                        }
                        _this.subscribeFieldInputEvents(_this.viewKeys);
                    }
                    // load output events if any
                    if (params.outputEvents != null) {
                        _this.outputEvents = params.outputEvents;
                    }

                    // load the form 
                    _this.loadTableData();

                    // Load widgets configurations
                    _this.loadWidgetsConfiguration(params.widgetsConfiguration);
                }
                else {
                    if (results.reason === 'Not Authorized') {
                        _this._console.log('Not Authorized');
                        _this.isAuthorized = false;
                    }
                    else {
                        // Show error snackbar
                        _this.showErrorToast(results.reason);
                    }
                    // // Show error snackbar
                    // _this._toastService.showErrorToast(results.reason);
                }
            });
        _this.generalSubscriptions.push(subscription);
    }

    sendEmail(data: any, outputEventWhenComplete: string, value: any) {
        const _this = this;

        if (data.templateKey) {
            _this.backendService.sendEmailUsingTemplate(data);
        } else {
            _this._dialogService.showLoadingDialog('Sending Email', 'Sending email. Please wait...');
            const subscription = _this.backendService.sendEmail(data.subject, data.header, data.footer, data.company, data.sender, data.to, data.cc, data.ccn)
                .subscribe(
                    result => {
                        _this._dialogService.closeDialog();
                        if (result.Success) {
                            _this._toastService.showSuccessToast('Email sent successfully!');
                            if (outputEventWhenComplete) {
                                _this.pubSubService.publishEvent(outputEventWhenComplete, value);
                            }
                        }
                        else {
                            _this.showErrorToast(result.Error);
                        }

                    }, error => {
                        _this._dialogService.closeDialog();
                        _this.showErrorToast(error);
                    }
                );
            _this.generalSubscriptions.push(subscription);
        }
    }

    subscribeFieldInputEvents(viewKeys: FormViewKey[]): void {
        const _this = this;
        for (let i = 0; i < viewKeys.length; i++) { // subscribe to single field events
            const key = viewKeys[i];
            // subscribe to input events
            if (key.inputEvents != null) {
                for (let j = 0; j < key.inputEvents.length; j++) {
                    const event = key.inputEvents[j];
                    const subscription = _this.pubSubService.subscribe(event.eventName, value => {
                        _this.eventCallback(event, value, key.key);
                    });
                    _this.formSubscriptions.push(subscription);
                }
            }
            // subscribe to combos
            if (key.format.viewType === 'combobox') {
                // subscribe combobox lazy loading events
                const lazy_subscription = _this.pubSubService.subscribe(_this.formParams.entryName + '_' + key.key + '_combo_lazy_loading',
                    value => {
                        _this.eventCallback({ actionType: 'combo_lazy_loading' }, value, value.data);
                    });
                _this.formSubscriptions.push(lazy_subscription);
            }
            if (key.format.viewType === 'subform' && key.format.subform_keys != null) {
                _this.subscribeFieldInputEvents(key.format.subform_keys);
            }
        }
    }

    getCurrentKeys(validKeysArray: FormViewKey[], inputKeys: any) {

        const outputKeys = {};
        for (const key in inputKeys) {
            if (inputKeys.hasOwnProperty(key)) {
                const element = inputKeys[key];
                if (validKeysArray != null && validKeysArray.find(e => e.key === key)) {
                    if (element == null || (element.id == null && element.value == null)) {
                        outputKeys[key] = element;
                    }
                    else if (element.id != null) {
                        outputKeys[key] = element.id;
                    }
                    else if (element.value != null) {
                        outputKeys[key] = element.value;
                    }
                }
            }
        }

        return outputKeys;
    }

    loadTableData(): void {

        const _this = this; // useful to debug
        _this.isLoading = true;

        const subscription = _this.backendService.getData(_this.formParams.entryName, _this.authService.getCurrentCompany(_this.currentKeys), {..._this.currentKeys, ..._this.externalKeys}, null, true, _this.formParams.isNew, null, false).subscribe(
            results => {
                _this._console.log(results);
                if (results.result === 'OK') {
                    _this.isReadOnly = results.flags.readOnly;
                    // hide/make read only relevant rows if any
                    if (results.properties.hidden != null && results.properties.hidden.length) {
                        _this.hiddenRows = results.properties.hidden.map(p => p.label);
                    }
                    if (results.properties.readOnly != null && results.properties.readOnly.length) {
                        _this.readonlyRows = results.properties.readOnly.map(p => p.label);
                    }
                    else {
                        _this.readonlyRows = [];
                    }
                    // signal parent to show/hide "save" icon
                    _this.sendEvent.emit({ eventType: 'readOnly', value: _this.isReadOnly });
                    if (_this.formParams.isNew) {  // handle newly set primary keys
                        const primaryKeys = _this.viewKeys.filter(key => key.isPrimary);
                        _this.currentKeys = _this.getCurrentKeys(primaryKeys, results.data[0]);  // TBC why do we receive an array with one element here?
                        _this.sendEvent.emit({ eventType: 'updateKeys', viewKeys: _this.currentKeys });
                    }

                    // Process results
                    _this.results = results.data;
                    _this.attributes = results.attributes;
                    _this.processResults(_this.results);
                    // _this.loadWidgetsConfiguration = _this.results.widgetsConfiguration;
                    // Stop loading
                    _this.isLoading = false;
                }
                else {
                    // Show error snackbar
                    _this.showErrorToast(results.reason);

                    // Set results empty
                    _this.results = [];
                    _this.processResults(_this.results);

                    // Stop loading
                    _this.isLoading = false;
                }
            },
            error => {
                _this.showErrorToast(error);

                // Set results empty
                _this.results = [];
                _this.processResults(_this.results);

                // Stop loading
                _this.isLoading = false;
            });

        _this.generalSubscriptions.push(subscription);
    }

    processResults(results): void {
        const _this = this;
        _this.numRows = results.length;

        // prepare the form
        _this.filteredFormData = _this.numRows === 0 ? [] : JSON.parse(JSON.stringify(_this.getFormData(_this.viewKeys, results)));
        _this.quickAddData = _this.filteredFormData.map(x => false);
        _this.resetPagination();

        // process the form
        _this.process_form(_this.filteredFormData);

        // emit event for the parent
        _this.sendEvent.emit({ eventType: 'updateData', data: _this.filteredFormData });
    }

    addRow(default_keys: any): void {
        const _this = this;
        _this.isAddingNew = true;
        const subscription = _this.backendService.getData(_this.formParams.entryName, _this.authService.getCurrentCompany(_this.currentKeys), {..._this.currentKeys, ..._this.externalKeys}, null, true, true, null, false).subscribe(
            result => {
                _this._console.log(result);
                if (result.result === 'OK') {
                    result = result.data;
                    // add passed keys, if any - useful to valorize father's keys in subtables
                    if (default_keys != null) {
                        for (let i = 0; i < result.length; i++) {
                            let element = result[i];
                            element = Object.assign(element, default_keys);
                        }
                    }
                    // update the status to prevent the whole table refresh
                    _this.addingNew = true;

                    // process the new row
                    const filteredFormData = _this.getFormData(_this.viewKeys, result);
                    _this.process_form(filteredFormData);

                    _this._console.log('filteredFormData[0]', filteredFormData[0]);

                    if (_this.filteredFormData && _this.filteredFormData.length) {
                        _this.filteredFormData.unshift(filteredFormData[0]);
                        _this.quickAddData.unshift(true);
                    }
                    else {
                        _this.filteredFormData = filteredFormData;
                        _this.quickAddData = [true];
                    }
                    // add it to the top of the list
                    _this.resetPagination();

                }
                else {
                    // Show error snackbar
                    _this.showErrorToast(result.reason);
                }
                _this.isAddingNew = false;
            },
            error => {
                _this.showErrorToast(error);
                _this.isAddingNew = false;
            });
        _this.generalSubscriptions.push(subscription);
    }

    private getFormData(formKeys: FormViewKey[], values: any, startingIndex = 0): FieldConfig[][] {

        const fieldValuesArray: FieldConfig[][] = [[]];

        for (let index = 0; index < values.length; index++) {
            fieldValuesArray[index] = this.getFieldValues(formKeys, values, index + startingIndex);
        }
        return fieldValuesArray;

    }

    private getSubKeysObject(subKeys: [{ key: string, dataType: FormDataType }], commaSeparatedValues: string): any {
        const outputObject = {};
        if (commaSeparatedValues == null) {
            return null;
        }
        // field is of type '(key1,key2)', get the array
        try {
            const subKeysArray = commaSeparatedValues.split('(')[1].split(')')[0].split(',');
            for (let i = 0; i < subKeys.length; i++) {
                const subKey = subKeys[i];
                outputObject[subKey.key] = subKey.dataType === 'number' ? parseInt(subKeysArray[i], 10) : subKeysArray[i];
            }
        } catch (e) {
            this._console.log('something wrong with subkeys');
        }
        return outputObject;
    }

    private getFieldValues(formKeys: FormViewKey[], values: any, index: number): FieldConfig[] {
        const _this = this;
        const fieldValues = new Array();
        for (let i = 0; i < formKeys.length; i++) {
            const field = formKeys[i];
            if (field != null) {
                const element = values[index][field.key];
                // process subkeys of combos/radiobuttons/etc.
                if (field.subKeys != null && field.subKeys.length > 0) {
                    if (element.options != null) {
                        for (let j = 0; j < element.options.length; j++) {
                            const option = element.options[j];
                            if (option.id != null) {
                                option.id = _this.getSubKeysObject(field.subKeys, option.id);
                            }
                        }
                    }
                    if (element.value != null) {
                        element.value = _this.getSubKeysObject(field.subKeys, element.value);
                    }
                }
                let fieldValue: FieldConfig;
                if (field != null) {
                    fieldValue = _this.getFieldValue(field, element, values, index);
                    fieldValues.push(fieldValue);
                }
            }
        }
        return fieldValues;
    }

    private getFieldValue(field: FormViewKey, element: any, values: any, index: number): FieldConfig {
        const _this = this;
        let fieldValue: FieldConfig;

        const attribute = _this.attributes[field.key];

        let attributeStyle = null;

        if (attribute != null && attribute.style != null) {
            attributeStyle = {};
            for (const style in attribute.style) {
                if (Object.prototype.hasOwnProperty.call(attribute.style, style)) {
                    const el = attribute.style[style];
                    if (el != null && el[index] != null) {
                        attributeStyle[style] = el[index];
                    }
                }
            }
        }

        if (field != null) {
            fieldValue = {
                table: _this.formParams.entryName,
                label: field.label,
                translate: field.translate,
                tooltip: field.tooltip,
                name: field.key,
                type: field.format.viewType,
                widgetType: field.format.widgetType,
                index: index,
                fullValueSet: values[index],
                value: (element != null) ? ((element.options != null) ? element.value : element) : null,
                inputType: (field.format.dataType != null) ? field.format.dataType : 'text',
                prefix: field.format.prefix,
                suffix: field.format.suffix,
                pipe: field.format.pipe,
                readonly: (attribute != null && attribute.readOnly != null && attribute.readOnly[index] != null) ? attribute.readOnly[index] : _this.isReadOnly ? true : (field.readOnly != null) ? field.readOnly : false,
                isVisible: (attribute != null && attribute.isHidden != null && attribute.isHidden[index] != null) ? !attribute.isHidden[index] : field.isHidden != null ? !field.isHidden : true,
                newLine: (field.newLine != null) ? field.newLine : true,
                textareaHeight: (field.textareaHeight != null) ? field.textareaHeight : 'S',
                showTextAreaRichFormatter: field.showTextAreaRichFormatter || false,
                buttonIcon: (field.buttonIcon != null) ? field.buttonIcon : null,
                confirmButtonAction: (field.confirmButtonAction != null) ? field.confirmButtonAction : false,
                isDownloadButton: (field.isDownloadButton != null) ? field.isDownloadButton : false,
                style: attributeStyle != null ? Object.assign(field.style, attributeStyle) : (field.style != null) ? field.style : null,
                width: (field.size != null) ? (field.size * 10) : null, // leave a 1% margin left and right   
                options: (element != null && element.options != null) ? element.options : [],
                menuOptions: (field.format != null && field.format.menuOptions != null) ? field.format.menuOptions : [],
                lazyLoading: (element != null && element.lazyLoading) ? true : false,
                validations: (field.format.validations != null) ? field.format.validations : [],
                eventName: (field.outputEvent != null) ? field.outputEvent.eventName : null,  // output events are directly handled by the target field component
                eventTrigger: (field.outputEvent != null) ? field.outputEvent.eventTrigger : null, // at the moment only implemented by input element for focus/blur
                conditionalQuery: (field.outputEvent != null && field.outputEvent.conditionalQuery != null) ? field.outputEvent.conditionalQuery : null,
                subform: (field.format.viewType === 'subform') ? _this.getFieldValues(field.format.subform_keys, values, index) : null
            };
        }
        /*
        if (fieldValue.newLine) {
            _this._console.log(`Field: ${fieldValue.label} has new line.`);
        }
        */
        //console.table(fieldValue);
        return fieldValue;
    }

    private process_form(input_form: FieldConfig[][]): void { // pre-process form got from back-end

        for (let index = 0; index < input_form.length; index++) {
            this.process_form_row(input_form[index], this.margins);
        }

    }

    private process_form_row(input_form_row: FieldConfig[], margins: number): void {
        let sameLineElements: FieldConfig[] = [];
        for (const result of input_form_row) {
            if (result['validations'] && result['validations'].length > 0) {
                result['validations'] = ValidationsService.processFormValidations(result['validations']);
            }

            // Nicola's code for creating elements width
            // if (result.width == null && result.subform == null) {     // if null, must be null for all elements on the same line, then split the width equally
            //     if (result['newLine'] === false) {
            //         sameLineElements.push(result);
            //     } else {
            //         result.width = this.processInlineElements(sameLineElements, margins);
            //         sameLineElements = [];
            //     }
            // }

            if (result.isVisible) {
                sameLineElements.push(result);
            }
            else {
                result.width = 0;
            }
            if (result.subform == null) {     // if null, must be null for all elements on the same line, then split the width equally
                if (result['newLine'] === true && sameLineElements !== null && sameLineElements.length > 0) {
                    // result.width = this.processInlineElements(sameLineElements, margins);
                    this.processInlineElements(sameLineElements, margins);
                    sameLineElements = [];
                }
            }

            // recursively process subform
            if (result.subform != null) {
                this.process_form_row(result.subform, margins);
            }
        }
        this.processInlineElements(sameLineElements, margins); // handles inline elements of last line
    }

    private processInlineElements(elements: FieldConfig[], margins: number): number {


        // Nicola's code
        // const numElements = 1 + elements.length; // current + previouses
        const numElements = elements.length; // current + previouses
        let sumWidths = 0;
        if (elements.length) { // some elements to put on the same line
            // process the elements with defined 1/10 size first
            const singleWidth = Math.floor(100 / numElements);
            // for (const element of elements) {
            //     element.width = singleWidth - margins; // considering 4% margins;
            //     sumWidths += singleWidth;
            // }
            for (let i = 0; i < elements.length; i++) {
                if (i === elements.length - 1) {
                    elements[i].width = 100 - margins - sumWidths; // considering 4% margins;
                }
                else {
                    if (elements[i].width === null) {
                        sumWidths += singleWidth;
                        elements[i].width = singleWidth - margins; // considering 4% margins;
                    }
                    else {
                        sumWidths += elements[i].width;
                        elements[i].width = elements[i].width - margins; // considering 4% margins;
                    }
                }

            }
        }
        return (100 - margins - sumWidths); // considering 4% margins
    }

    private replaceLocalKeys(functString: string, keys: any): string {
        const delimiter = '£';
        // tslint:disable-next-line: forin
        for (const key in keys) {
            const toReplace = delimiter + key + delimiter;
            let replacement = keys[key];
            // check if it is an object
            if (replacement != null && replacement.id != null) {
                replacement = replacement.id;
            }
            let newString = functString.replace(toReplace, replacement);
            while (newString !== functString) { // handle multiple occurences
                functString = newString;
                newString = functString.replace(toReplace, replacement);
            }
        }
        return functString;
    }



    // callback for pubSub events, value has form of {origin, index, valueSet, data}
    private eventCallback(event: any, value: any, keyListener: string): void {
        const _this = this;
        // console.table(event);
        // console.table(value);
        // console.table(_this.filteredFormData);
        // _this._console.log(`keyListener: ${keyListener}`);
        _this._console.log(event, value, keyListener);

        // check  if this is a formRowProperties event
        if (event.actionType === 'showRow' && event.condition === 'equalTo') {

            // Check if formRowProperties contains keys 
            if (event.keys != null) {
                // Check each form table line to see if the condition is met
                for (let i = 0; i < _this.filteredFormData.length; i++) {
                    const formKeys = _this.filteredFormData[i];

                    let matchingKeys = true;
                    let matchingValues = true;

                    // Run for each key
                    for (let j = 0; j < event.keys.length; j++) {
                        const key = event.keys[j];

                        let senderValue;
                        const receiverEntry: any = formKeys.find(x => x.label === key.receiver);
                        const receiverValue = receiverEntry ? receiverEntry.value : key.receiver;

                        // If it's %value%, put in values variables
                        if (key.sender.includes('%value%')) {
                            senderValue = value.data;
                            const equalNotEqualEntry: any = formKeys.find(x => x.label === 'equal_notequal');
                            const equalNotEqualValue = equalNotEqualEntry ? equalNotEqualEntry.value : 'equal_notequal';
                            if (equalNotEqualValue === 'notEqualTo') {
                                if (senderValue != null && Array.isArray(senderValue)) {  // check if it is an array (checkbox group)
                                    for (let k = 0; k < senderValue.length; k++) { // at least one array value matches
                                        const element = senderValue[k];
                                        if (element == receiverValue) {
                                            matchingValues = false;
                                        }
                                    }
                                } else if (senderValue == null || senderValue == receiverValue) {
                                    matchingValues = false;
                                }
                            } else { //value.valueSet.equal_notequal === 'equalTo'
                                if (senderValue != null && Array.isArray(senderValue)) {  // check if it is an array (checkbox group)
                                    matchingValues = false;
                                    for (let k = 0; k < senderValue.length; k++) { // at least one array value matches
                                        const element = senderValue[k];
                                        if (element == receiverValue) {
                                            matchingValues = true;
                                        }
                                    }
                                } else if (senderValue == null || senderValue != receiverValue) {
                                    matchingValues = false;
                                }
                            }
                        }
                        else {  // compare keys
                            senderValue = value.valueSet[key.sender] ? value.valueSet[key.sender] : key.sender;
                            if (senderValue != receiverValue) {
                                matchingKeys = false;
                            }
                        }
                    }

                    // // Perform action based on conditions check above
                    // if (!matchingKeys) {
                    //     return; // the message is not for this row
                    // }

                    // Zee change: Perform action based on conditions check above
                    // return is causing issue as it goes out of for loop prematurely
                    if (matchingKeys) {
                        _this.hiddenRows[i] = !matchingValues;
                    }

                }
            }
            return;
        }
        // not a ViewProperties event, check the condition if any -- TODO: support other conditions beyond equalTo 
        let conditionMet = true;

        if (event.condition != null) {
            // normalize if boolean conditions
            let eventValues = event.values.map(v => v === 'true' ? '1' : v === 'false' ? '0' : v);
            let msgData = Array.isArray(value.data) ? value.data : [value.data];
            msgData = msgData.map(m => m === true || m === 'true' || m === 't' ? '1' : m === false || m === 'false' || m === 'f' ? '0' : m);
            // handle jolly chars 
            eventValues = eventValues.map(e => e === '*' ? msgData[eventValues.indexOf(e)] : e);

            if (event.condition === 'equalTo') {
                // tricky way to compare two arrays
                conditionMet = JSON.stringify(eventValues) === JSON.stringify(msgData);
            }
            else if (event.condition === 'notEqualTo') {
                // tricky way to compare two arrays
                conditionMet = JSON.stringify(eventValues) !== JSON.stringify(msgData);
            }
        }

        if (event.actionType === 'show' || event.actionType === 'hide' || event.actionType === 'toggle') {
            // get the listener element if not full table
            let listener: FieldConfig = null;
            // if (keyListener != null && value.type !== 'page') {
            if (keyListener != null) {
                const targetLine = _this.filteredFormData[value.index];  // recover the form "line"
                if (targetLine != null) {
                    listener = HelperService.findElement(targetLine, keyListener);
                    // listener = targetLine.find(field => field.name === keyListener);
                }
            }
            if (keyListener == null) {   // act on the full table
                if (conditionMet) {
                    _this.formParams.isVisible = event.actionType === 'show' ? true : event.actionType === 'hide' ? false : !_this.formParams.isVisible;
                } else {
                    _this.formParams.isVisible = event.actionType === 'show' ? false : event.actionType === 'hide' ? true : _this.formParams.isVisible;
                }
            } else if (listener != null) {  // act on the listening element
                if (conditionMet) {
                    listener.isVisible = event.actionType === 'show' ? true : event.actionType === 'hide' ? false : !listener.isVisible;
                } else {
                    listener.isVisible = event.actionType === 'show' ? false : event.actionType === 'hide' ? true : listener.isVisible;
                }
            }
            if (event.outputEventWhenComplete != null) {
                _this.pubSubService.publishEvent(event.outputEventWhenComplete, value);
            }
        } else if (event.actionType === 'readOnly') {
            // get the listener element if not full table
            let listener: FieldConfig = null;
            if (keyListener != null && value.type !== 'page') {
                const targetLine = _this.filteredFormData[value.index];  // recover the form "line"
                if (targetLine != null) {
                    listener = HelperService.findElement(targetLine, keyListener);
                    // listener = targetLine.find(field => field.name === keyListener);
                }
            }
            if (keyListener == null) {   // act on the full table --> NO! formRowProperties must be used in this case!!!
                // _this.isReadOnly = conditionMet;
                // _this.sendEvent.emit({ eventType: 'readOnly', value: _this.isReadOnly }); // signal to the parent to show/hide save button
            } else if (listener != null) {  // act on the listening element
                listener.readonly = conditionMet;
            }
            if (event.outputEventWhenComplete != null) {
                _this.pubSubService.publishEvent(event.outputEventWhenComplete, value);
            }
        } else if (event.actionType === 'reload' && conditionMet) {
            _this.refreshView(false);
            if (event.outputEventWhenComplete != null) {
                _this.pubSubService.publishEvent(event.outputEventWhenComplete, value);
            }
        } else if (event.actionType === 'update_time_tracker') {
            //_this._timeTrackerService.isTrStarted = !_this._timeTrackerService.isTrStarted;
            //_this._timeTrackerService.fromOtherPlaces = true;
            _this._timeTrackerService.checkStatus();
        } else if (event.actionType === 'navigate' && conditionMet) {
            const formLine = _this.filteredFormData[value.index];
            const navigationKeys = {};
            for (let j = 0; j < formLine.length; j++) {
                const key = formLine[j];
                navigationKeys[key.name] = key.value;
            }
            // formLine.reduce((outputKeys, key) => {
            //     outputKeys[key.name] = key.value;
            //     return outputKeys;
            // }, {});
            let filteredKeys = {};
            if (event.actionTarget.keymap != null && event.actionTarget.keymap.length) { // explicit key map between tables
                for (let i = 0; i < event.actionTarget.keymap.length; i++) {
                    const element = event.actionTarget.keymap[i];
                    if (element.source != null && element.destination != null) {

                        // If we came from show_message event, the keys must be in value.data
                        if (typeof (value.data) === 'object' && value.data['keys'] && value.data['keys'][element.source]) {
                            filteredKeys[element.destination] = value.data['keys'][element.source] != null ? value.data['keys'][element.source] : null;
                        }
                        // Check if event contains values in case of manually generated event
                        else if (event.values != null) {
                            filteredKeys[element.destination] = event.values[element.source] != null ? event.values[element.source] : null;
                        }
                        else if (navigationKeys != null) {
                            filteredKeys[element.destination] = navigationKeys[element.source] != null ? navigationKeys[element.source].id != null ? navigationKeys[element.source].id : navigationKeys[element.source] : null;
                        }
                    }

                }
            }
            else {
                const primaryKeys = _this.viewKeys.filter(key => key.isPrimary);
                filteredKeys = _this.getCurrentKeys(primaryKeys, navigationKeys);
            }


            // destroy current subscriptions before moving to a new view
            _this.formSubscriptions.forEach(subscription => {
                subscription.unsubscribe();
            });
            _this.sendEvent.emit({ eventType: 'navigate', queryParams: { entry: event.actionTarget, keys: [filteredKeys], index: 1, total: 1 } });
            if (event.outputEventWhenComplete != null) {
                _this.pubSubService.publishEvent(event.outputEventWhenComplete, value);
            }
        } else if ((event.actionType === 'query' || event.actionType === 'query_style' || event.actionType === 'combo_lazy_loading') && conditionMet) {
            let chiavi = {};
            const target_index = (value.type !== 'page') ? value.index : null;  // null means the event comes from the full table
            let index = (target_index == null) ? _this.formArray.length : 1;
            const targetViewField = _this.viewKeys.find(viewKey => viewKey.key === keyListener);
            const childrenArray = _this.formArray.toArray();
            // iterate over all indexes when full table or instead affect the target index only
            while (index > 0) {
                index--;
                const current_index = (target_index != null) ? target_index : index;
                // some lines might be hidden, search for the right one
                const current_line = childrenArray.find(c => c.fields[0].index === current_index);
                if (current_line == null) {
                    continue;
                }
                chiavi = current_line.form.value;
                // fix problem with changed value that might be not updated yet by getting it directly from event
                if (value.type === 'change') {
                    chiavi[value.origin] = value.data;
                }
                // process values
                for (const key in chiavi) {
                    if (chiavi.hasOwnProperty(key)) {
                        const element = chiavi[key];
                        if (element == null) {
                            continue; // skip null entries
                        }
                        // decode combos
                        if (element['id'] != null) {
                            chiavi[key] = element['id'];
                        }
                        // encode boolean
                        else if (element === true) {
                            chiavi[key] = '1';
                        }
                        else if (element === false) {
                            chiavi[key] = '0';
                        }
                    }
                }
                if (value.showEventProcessing === true) {
                    _this._dialogService.showLoadingDialog("Processing", "Please wait...");
                }
                const subscription = _this.backendService.postEvent(_this.formParams.entryName, _this.authService.getCurrentCompany(_this.currentKeys), {..._this.currentKeys, ..._this.externalKeys}, keyListener, chiavi, event.eventName, event.actionType).subscribe(
                    result => {
                        if (result.result === 'OK') {
                            if (event.successMessage) {
                                _this._toastService.showSuccessToast(event.successMessage);
                            }

                            result = result.data;
                            _this._console.log(`keyListener: ${keyListener}`);
                            //console.table(result);
                            if (event.actionType === 'query') {
                                let combobox: ComboboxComponent = null;
                                if (typeof result === 'object' && result.value != null) {   // got combobox/radiobutton/checkboxgroup options
                                    // Old method
                                    // _this.formArray[value.index].form.patchValue({ [keyListener]['options']: result});
                                    combobox = <ComboboxComponent>current_line.dynamicFields.find(df => df.field.name === keyListener).componentRef.instance;
                                    // Set options and make sure we don't cause the onchange selector while
                                    // changing options
                                    if ((result.options != null && result.options[0] != null) || result.value == null) {
                                        combobox.setOptions(result.options, true);
                                    }
                                    result = result.value;
                                }
                                for (var k in result[0]) {
                                    if (result[0].hasOwnProperty(k)) {
                                        // patch the form
                                        current_line.form.patchValue({ [k]: result[0][k] });
                                        // patch the undelying data
                                        const el = HelperService.findElement(_this.filteredFormData[current_index], k);
                                        // const el = _this.filteredFormData[current_index].find(field => field.name === k);
                                        if (el != null && result[0][k] != null) {
                                            // If combobox, set the value using the options available
                                            // so cannot add directly
                                            if (combobox) {
                                                combobox.setValue(result[0][k]);
                                            }
                                            else {
                                                // It's not a combobox so set value directly
                                                el.value = result[0][k];
                                            }
                                        }
                                    }
                                }
                            } else if (event.actionType === 'combo_lazy_loading') {
                                // Issue #178
                                let comboboxEl = _this.findElementInDynamicFields(current_line.dynamicFields, keyListener);
                                if (comboboxEl) {
                                    let combobox: ComboboxComponent = null;
                                    combobox = <ComboboxComponent>comboboxEl.componentRef.instance;
                                    const comboValue = combobox.field.value != null ? combobox.field.value.id : null;
                                    combobox.setOptions(result, true, true);
                                    if (comboValue != null) {
                                        combobox.setValue(comboValue);
                                    }
                                }
                            } else {  // query_style
                                const filterFormData = (dataset, param) => {
                                    let found = HelperService.findElement(dataset, param);
                                    // let found = dataset.find(field => field.name === param);
                                    if (found == null) {
                                        for (let i = 0; i < dataset.length; i++) {
                                            if (dataset[i].subform != null) {
                                                found = filterFormData(dataset[i].subform, param);
                                                if (found != null) {
                                                    break;
                                                }
                                            }
                                        }
                                    }
                                    return found;
                                };
                                const element = filterFormData(_this.filteredFormData[current_index], keyListener);
                                if (element != null && event.styleAttribute != null) {
                                    if (element.style == null) {
                                        element.style = {};
                                    }

                                    if (result[0]) {
                                        // we can get multiple rows from backend, each one providing a different attribute, find the right one
                                        const attrKey = keyListener + '_' + event.styleAttribute; // as per specs the returned key is of type '<key>_<styleAttribute>'
                                        if (result[0][attrKey]) {
                                            element.style[event.styleAttribute] = result[0][attrKey];
                                        }
                                        else {
                                            _this._console.log(`result does not contain attrKey: ${attrKey}`);
                                        }
                                    }
                                }
                            }
                            // Close processing dialog
                            _this._dialogService.closeDialog();
                            if (event.outputEventWhenComplete != null) {
                                _this.pubSubService.publishEvent(event.outputEventWhenComplete, value);
                            }
                        }
                        else {
                            // Close processing dialog
                            _this._dialogService.closeDialog();

                            // Show error snackbar
                            _this._console.log(`keyListener: ${keyListener}`);
                            //console.table(result);

                            _this._console.log(result);
                            _this.showErrorToast(result.reason);
                        }
                    });

                _this.generalSubscriptions.push(subscription);
            }
            /* if (event.outputEventWhenComplete != null) {
                _this.pubSubService.publishEvent(event.outputEventWhenComplete, value);
            } */
        } else if ((event.actionType === 'update' || event.actionType === 'update_style') && conditionMet) {
            if (event.updateFunct != null && keyListener != null) {
                const childrenArray = _this.formArray.toArray();
                // some lines might be hidden, search for the right one
                const current_line = childrenArray.find(c => c.fields[0].index === value.index);
                if (current_line == null) {
                    return;
                }
                const keys = current_line.form.value;
                const resolvedFunct = _this.replaceLocalKeys(event.updateFunct, keys);
                // tslint:disable-next-line: no-eval
                if (event.actionType === 'update') {
                    current_line.form.patchValue({ [keyListener]: eval(resolvedFunct) });
                } else { // update_syle
                    const element = HelperService.findElement(this.filteredFormData[value.index], keyListener);
                    // const element = _this.filteredFormData[value.index].find(field => field.name === keyListener);
                    if (element != null && event.styleAttribute != null) {
                        element.style[event.styleAttribute] = eval(resolvedFunct);
                    }
                }
            }
            if (event.outputEventWhenComplete != null) {
                _this.pubSubService.publishEvent(event.outputEventWhenComplete, value);
            }
        } else if (event.actionType === 'show_message' && conditionMet && event.message) {
            // Show confirmation dialog
            _this._dialogService.showConfimationDialog(event.message.messageTitle != null ? event.message.messageTitle : 'Confirm', event.message.messageText, 'Yes', 'No', 'info').then((result) => {
                // Initialize with No action info
                var actionType = event.message.actionOnNo.actionType;
                var queryFunct = event.message.actionOnNo.queryFunct;
                var action = 'actionNo';

                // If user clicked yes, load yes action info 
                if (result.value === true) {
                    actionType = event.message.actionOnYes.actionType;
                    queryFunct = event.message.actionOnYes.queryFunct;
                    action = 'actionYes'
                }

                // Let's perform Yes Action
                if (actionType === 'reload') {
                    _this.reload();
                    // Reload screen
                    if (event.outputEventWhenComplete != null) {
                        _this.pubSubService.publishEvent(event.outputEventWhenComplete, value);
                    }
                }
                else if (action === 'update_time_tracker') {
                    //_this._timeTrackerService.isTrStarted = !_this._timeTrackerService.isTrStarted;
                    // = true;
                    _this._timeTrackerService.checkStatus();
                }
                else if (actionType === 'email' || actionType === 'create_user_and_email') {

                    let formValues = _this.formArray.first.form.value;
                    
                    
                    if(actionType === 'create_user_and_email') {
                        const username = formValues['email_to'];
                        const email = username;
                        const password = HelperService.generatePassword(9);

                       _this.authService.setUsername(username);
                       _this.authService.setPassword(password);
                       _this.authService.setEmail(email);
                       _this.authService.signUp()
                       .then((user) => {
                         console.log(user);
                         _this.performSendEmail(event, formValues, value);
                    
                        })
                       .catch((err) => {
                        _this._toastService.showErrorToast(err);
                        //  this._setError(err);
                       });                       
                    }
                    else {
                        _this.performSendEmail(event, formValues, value);
                    }
                    // _this._console.log(JSON.stringify(event));
                    // _this.sendEmail({ templateKey: 'test' });
                }
                else if (actionType === 'regulat_api') {
                    _this.runRegulatEvent(event.message.actionOnYes, value, keyListener);
                }
                else {
                    // Run query
                    let chiavi = {};
                    const target_index = (value.type !== 'page') ? value.index : null;  // null means the event comes from the full table
                    let index = (target_index == null) ? _this.formArray.length : 1;
                    const targetViewField = _this.viewKeys.find(viewKey => viewKey.key === keyListener);
                    const childrenArray = _this.formArray.toArray();
                    // iterate over all indexes when full table or instead affect the target index only
                    while (index > 0) {
                        index--;
                        const current_index = (target_index != null) ? target_index : index;
                        // some lines might be hidden, search for the right one
                        const current_line = childrenArray.find(c => c.fields[0].index === current_index);
                        if (current_line == null) {
                            continue;
                        }
                        chiavi = current_line.form.value;
                        // fix problem with changed value that might be not updated yet by getting it directly from event
                        if (value.type === 'change') {
                            chiavi[value.origin] = value.data;
                        }
                        // process values
                        for (const key in chiavi) {
                            if (chiavi.hasOwnProperty(key)) {
                                const element = chiavi[key];
                                if (element == null) {
                                    continue; // skip null entries
                                }
                                // decode combos
                                if (element['id'] != null) {
                                    chiavi[key] = element['id'];
                                }
                                // encode boolean
                                else if (element === true) {
                                    chiavi[key] = '1';
                                }
                                else if (element === false) {
                                    chiavi[key] = '0';
                                }
                            }
                        }
                        const subscription = _this.backendService.postEvent(_this.formParams.entryName, _this.authService.getCurrentCompany(_this.currentKeys), {..._this.currentKeys, ..._this.externalKeys}, keyListener, chiavi, event.eventName, action, true).subscribe(
                            result => {
                                if (result.result === 'OK') {
                                    _this._console.table(result);
                                    if (result.data) {
                                        if (Array.isArray(result.data)) {
                                            // I am hoping that the result contains keys for the next event
                                            value.data = {};
                                            value.data['keys'] = result.data[0];
                                        }
                                        else {
                                            value.data = result.data;
                                        }
                                    }

                                    if (event.successMessage) {
                                        _this._toastService.showSuccessToast(event.successMessage);
                                    }
                                    else {
                                        _this._toastService.showSuccessToast('Success!');
                                    }
                                    if (event.outputEventWhenComplete != null) {
                                        _this.pubSubService.publishEvent(event.outputEventWhenComplete, value);
                                    }
                                }
                                else {
                                    _this._console.table(result);
                                    _this._toastService.showErrorToast("Error " ,result.reason.detail == undefined ? '' : JSON.stringify(result.reason.detail) + (result.reason.hint == undefined ? '' : JSON.stringify(result.reason.hint)),5000,true);
                                }
                            });

                        _this.generalSubscriptions.push(subscription);
                    }
                }
            });



        } else if (event.actionType === 'google_api') {
            _this.runGoogleEvent(event, value, keyListener);
        } else if (event.actionType === 'regulat_api') {
            _this.runRegulatEvent(event, value, keyListener);
        } else if (event.actionType === 'dialog') {
            const dialogRef = _this.cutomDialog.open(MenuOptionsCustomDialogComponent, {
                width: '1280px',
                height: 'auto',
                data: {
                    ...event,
                    keys: _this.currentKeys    
                }
            })
            
            const dialogRefSub = dialogRef.afterClosed()
            .subscribe((response: any) => {
                dialogRefSub.unsubscribe();
                if (event.outputEventWhenComplete != null) {
                    _this.pubSubService.publishEvent(event.outputEventWhenComplete, value);
                }
            }, (error: any) => {
                dialogRefSub.unsubscribe();
            });
        }
    }

    private performSendEmail(event: any, formValues: any, value: any) {
        let _this = this;
        let emailActionParameters: EmailActionParameters = event.message.actionOnYes.emailActionParameters;

        // process the booleans (1/0 instead of true/false)
        for (const value in formValues) {
            if (formValues.hasOwnProperty(value)) {
                const element = formValues[value];
                if (element == null) {
                    continue; // skip null entries
                }
                // decode combos
                if (element['id'] != null) {
                    formValues[value] = element['id'];
                }

                // encode boolean
                else if (element === true) {
                    formValues[value] = '1';
                }
                else if (element === false) {
                    formValues[value] = '0';
                }
            }
        }

        let subject = 'OneCompliance';
        if (emailActionParameters.subjectKeys && emailActionParameters.subjectKeys.length) {
            subject = emailActionParameters.subjectKeys.map(key => formValues[key]).join(' ');
        }
        if (emailActionParameters.subject && emailActionParameters.subject.length) {
            subject = emailActionParameters.subject;
        }

        let sender = null;
        if (emailActionParameters.senderKey && emailActionParameters.senderKey.length) {
            sender = formValues[emailActionParameters.senderKey];
        }
        if (emailActionParameters.sender && emailActionParameters.sender.length) {
            sender = emailActionParameters.sender;
        }

        let recipients = null;
        if (emailActionParameters.recipientKeys && emailActionParameters.recipientKeys.length) {
            recipients = emailActionParameters.recipientKeys.map(key => formValues[key]).join(',');
        }
        if (emailActionParameters.recipientList && emailActionParameters.recipientList.length) {
            recipients = emailActionParameters.recipientList.join(',');
        }
        let cc = null;
        if (emailActionParameters.ccKeys && emailActionParameters.ccKeys.length) {
            cc = emailActionParameters.ccKeys.map(key => formValues[key]).join(',');
        }
        if (emailActionParameters.ccList && emailActionParameters.ccList.length) {
            cc = emailActionParameters.ccList.join(',');
        }
        let ccn = null;
        if (emailActionParameters.ccnKeys && emailActionParameters.ccnKeys.length) {
            ccn = emailActionParameters.ccnKeys.map(key => formValues[key]).join(',');
        }
        if (emailActionParameters.ccnList && emailActionParameters.ccnList.length) {
            ccn = emailActionParameters.ccnList.join(',');
        }
        let body = null;
        if (emailActionParameters.bodyKeys && emailActionParameters.bodyKeys.length) {
            body = emailActionParameters.bodyKeys.filter(key => formValues[key.key] && formValues[key.key].length).map(key => `${key.label}${formValues[key.key]}`).join('\n');
        }
        if (emailActionParameters.body && emailActionParameters.body.length) {
            body = emailActionParameters.body;
        }

        _this.sendEmail(
            {
                subject: subject,
                header: body,
                footer: null,
                company: _this.authService.getCurrentCompany(_this.currentKeys),
                sender: sender,
                to: recipients,
                cc: cc,
                ccn: ccn
            },
            emailActionParameters.outputEventWhenComplete,
            value
        );
    }

    async runGoogleEvent(event, value, keyListener) {
        let _this = this;
        const googleAPIParams: GoogleAPIParams = event.googleAPIParams;
        let formValues = _this.formArray.first.form.value;

        // process the booleans (1/0 instead of true/false)
        for (const value in formValues) {
            if (formValues.hasOwnProperty(value)) {
                const element = formValues[value];
                if (element == null) {
                    continue; // skip null entries
                }
                // decode combos
                if (element['id'] != null) {
                    formValues[value] = element['id'];
                }
                // encode boolean
                else if (element === true) {
                    formValues[value] = '1';
                }
                else if (element === false) {
                    formValues[value] = '0';
                }
            }
        }

        if (!googleAPIParams || !googleAPIParams.actionType) {
            _this._toastService.showErrorToast("Missing Google API Params");
        }
        else {
            if (googleAPIParams.actionType == 'get_directions') {
                if (!googleAPIParams.directionsParams) {
                    _this._toastService.showErrorToast("Missing Google API Get Directions Params");
                }
                else {
                    const origin = HelperService.getValueInValueSet(value.valueSet, googleAPIParams.directionsParams.originKey);
                    const destination = HelperService.getValueInValueSet(value.valueSet, googleAPIParams.directionsParams.destinationKey);
                }
            }
            else if (googleAPIParams.actionType == 'get_distance') {
                if (!googleAPIParams.distanceParams) {
                    _this._toastService.showErrorToast("Missing Google API Get Distance Params");
                }
                else {
                    const origin = formValues[googleAPIParams.distanceParams.originKey];
                    const destination = formValues[googleAPIParams.distanceParams.destinationKey];
                    if (!origin || !destination) {
                        _this._toastService.showErrorToast("Missing Google API Get Distance Params");
                    }
                    else {
                        _this.backendService.getDistance(origin, destination).subscribe(
                            response => {
                                // _this._console.log(response);
                                if (response.result === 'OK') {
                                    let distance = 0;
                                    if (response.data.rows && response.data.rows.length && response.data.rows[0].elements && response.data.rows[0].elements.length && response.data.rows[0].elements[0].distance && response.data.rows[0].elements[0].distance.value) {
                                        distance = (response.data.rows[0].elements[0].distance.value) / 1000;
                                    }

                                    let element = HelperService.findElement(this.filteredFormData[value.index], keyListener);
                                    // const element = _this.filteredFormData[value.index].find(field => field.name === keyListener);
                                    if (element != null) {
                                        element.value = distance;
                                    }
                                    // Try this as well in future if value not set
                                    // if(element.value != null) {
                                    //     const childrenArray = _this.formArray.toArray();
                                    //     const current_line = childrenArray.find(c => c.fields[0].index === 0);

                                    //     let dynamicEl = <InputComponent>_this.findElementInDynamicFields(current_line.dynamicFields, keyListener);
                                    //     if(dynamicEl && dynamicEl.setValue) {
                                    //         dynamicEl.setValue(distance);                                        
                                    //     }
                                    // }


                                    if (event.outputEventWhenComplete != null) {
                                        _this.pubSubService.publishEvent(event.outputEventWhenComplete, value);
                                    }
                                }
                                else {
                                    _this.showErrorToast(response.data);
                                }
                            },
                            error => {
                                _this._console.log(error);
                                _this.showErrorToast(error);
                            }
                        );
                    }

                }
            }
            else if (googleAPIParams.actionType == 'get_email_thread') {
                if (_this.authService.getSyncMode() === 'google') {
                    if (!googleAPIParams.emailThreadParams) {
                        _this._toastService.showErrorToast("Missing Google API Get Email Thread Params");
                    }
                    else {
                        const emailId = HelperService.getValueInValueSet(value.valueSet, googleAPIParams.emailThreadParams.emailIdKey);
                        const threadId = HelperService.getValueInValueSet(value.valueSet, googleAPIParams.emailThreadParams.threadIdKey);
                    }
                }
                else {
                    _this._dialogService.showErrorDialog("Error", "You are not subscribed to use Google services");
                }
            }
            else if (googleAPIParams.actionType == 'create_drive_folder') {
                if (_this.authService.getSyncMode() === 'google') {
                    if (!googleAPIParams.driveFolderParams) {
                        _this._toastService.showErrorToast("Missing Google API Drive Folder Params");
                    }
                    else {
                        const driveFolder = formValues[googleAPIParams.driveFolderParams.driveFolderKey];
                        if (!driveFolder) {
                            _this._toastService.showErrorToast("Missing Google API Drive Folder Params");
                        }
                        else {
                            let auth = _this.authService.loadGoogleAuth('gdrive');
                            _this.backendService.createDriveFolder(driveFolder, auth).subscribe(
                                response => {
                                    // _this._console.log(response);
                                    if (response['result'] === 'OK') {
                                        if (event.outputEventWhenComplete != null) {
                                            _this.pubSubService.publishEvent(event.outputEventWhenComplete, value);
                                        }
                                    }
                                    else {
                                        _this.showErrorToast(response['reason']);
                                    }
                                },
                                error => {
                                    _this._console.log(error);
                                    _this.showErrorToast(error);
                                }
                            );
                        }

                    }
                }
                else {
                    _this._dialogService.showErrorDialog("Error", "You are not subscribed to use Google services");
                }
            }
            else if (googleAPIParams.actionType == 'copy_s3_to_drive') {
                if (_this.authService.getSyncMode() === 'google') {
                    if (!googleAPIParams.s3ToDriveParams) {
                        _this._toastService.showErrorToast("Missing Google API Path Params");
                    }
                    else {
                        const s3Path = formValues[googleAPIParams.s3ToDriveParams.s3PathKey];
                        const drivePath = formValues[googleAPIParams.s3ToDriveParams.drivePathKey];
                        if (!s3Path || !drivePath) {
                            _this._toastService.showErrorToast("Missing Google API Path Params");
                        }
                        else {
                            let auth = _this.authService.loadGoogleAuth('gdrive');
                            _this.backendService.copyFromS3ToDrive(s3Path, drivePath, auth).subscribe(
                                response => {
                                    // _this._console.log(response);
                                    if (response['result'] === 'OK') {
                                        if (event.outputEventWhenComplete != null) {
                                            _this.pubSubService.publishEvent(event.outputEventWhenComplete, value);
                                        }
                                    }
                                    else {
                                        _this.showErrorToast(response['reason']);
                                    }
                                },
                                error => {
                                    _this._console.log(error);
                                    _this.showErrorToast(error);
                                }
                            );
                        }

                    }
                }
                else {
                    _this._dialogService.showErrorDialog("Error", "You are not subscribed to use Google services");
                }
            }
            else if (googleAPIParams.actionType == 'copy_drive_to_s3') {
                if (_this.authService.getSyncMode() === 'google') {
                    if (!googleAPIParams.driveToS3Params) {
                        _this._toastService.showErrorToast("Missing Google API Path Params");
                    }
                    else {
                        const drivePath = formValues[googleAPIParams.driveToS3Params.drivePathKey];
                        const s3Path = formValues[googleAPIParams.s3ToDriveParams.s3PathKey];
                        if (!drivePath || !s3Path) {
                            _this._toastService.showErrorToast("Missing Google API Path Params");
                        }
                        else {
                            let auth = _this.authService.loadGoogleAuth('gdrive');
                            _this.backendService.copyFromDriveToS3(drivePath, s3Path, auth).subscribe(
                                response => {
                                    // _this._console.log(response);
                                    if (response['result'] === 'OK') {
                                        if (event.outputEventWhenComplete != null) {
                                            _this.pubSubService.publishEvent(event.outputEventWhenComplete, value);
                                        }
                                    }
                                    else {
                                        _this.showErrorToast(response['reason']);
                                    }
                                },
                                error => {
                                    _this._console.log(error);
                                    _this.showErrorToast(error);
                                }
                            );
                        }

                    }
                }
                else {
                    _this._dialogService.showErrorDialog("Error", "You are not subscribed to use Google services");
                }
            }
            else if (googleAPIParams.actionType == 'get_emails_by_codice_azienda') {
                if (_this.authService.getSyncMode() === 'google') {
                    let loadingToast = _this._toastService.showLoadingToast("Loading emails", "Please wait...");
                    try {
                        const googleAuth = await _this.authService.loadGoogleAuth('gmail');
                        // get user data after login
                        const codiceAziendaList = _this.authService.userinfo.getValue().companies;

                        let getEmailsByCodiceAziendaResult = await _this._googleAPIService.getEmailsByCodiceAzienda(googleAuth, codiceAziendaList);
                        _this._console.log(getEmailsByCodiceAziendaResult);

                        _this._toastService.hideLoadingToast(loadingToast);

                        if (getEmailsByCodiceAziendaResult.result === 'OK') {
                            _this._toastService.showSuccessToast(event.successMessage || 'Done!');
                        }
                        else {
                            _this._toastService.showErrorToast(event.message || 'Error occured!');
                        }
                    }
                    catch (e) {
                        _this._console.log(e);
                        _this._toastService.hideLoadingToast(loadingToast);
                        _this._toastService.showErrorToast(e);
                    }
                }
                else {
                    _this._dialogService.showErrorDialog("Error", "You are not subscribed to use Google services");
                }
            }
            else if (googleAPIParams.actionType === "get_drive_changes") {
                if (_this.authService.getSyncMode() === 'google') {
                    let loadingToast = _this._toastService.showLoadingToast("Getting Google Drive changes", "Please wait...");
                    try {
                        const googleAuth = await _this.authService.loadGoogleAuth('gdrive');

                        let getChangesResult = await _this._googleAPIService.getChanges(googleAuth);
                        _this._console.log(getChangesResult);

                        _this._toastService.hideLoadingToast(loadingToast);

                        if (getChangesResult.result === 'OK') {
                            _this._toastService.showSuccessToast(event.successMessage || 'Done!');
                        }
                        else {
                            _this._toastService.showErrorToast(event.message || 'Error occured!');
                        }
                    }
                    catch (e) {
                        _this._console.log(e);
                        _this._toastService.hideLoadingToast(loadingToast);
                        _this._toastService.showErrorToast(e);
                    }
                }
                else {
                    _this._dialogService.showErrorDialog("Error", "You are not subscribed to use Google services");
                }
            }
            else if (googleAPIParams.actionType == 'get_folder_expanded_contents') {
                if (_this.authService.getSyncMode() === 'google') {
                    if (!googleAPIParams.driveExpandedContentsParams) {
                        _this._toastService.showErrorToast("Missing Google Drive Expanded Contents Params");
                    }
                    else {
                        const codiceAzienda = formValues[googleAPIParams.driveExpandedContentsParams.codiceAziendaKey];
                        const idAnagrafica = formValues[googleAPIParams.driveExpandedContentsParams.idAnagraficaKey];
                        const idProgetto = googleAPIParams.driveExpandedContentsParams.idProgettoKey ? formValues[googleAPIParams.driveExpandedContentsParams.idProgettoKey] : null;
                        const idRisorsa = googleAPIParams.driveExpandedContentsParams.idRisorsaKey ? formValues[googleAPIParams.driveExpandedContentsParams.idRisorsaKey] : null;
                        const idSondaggio = googleAPIParams.driveExpandedContentsParams.idSondaggioKey ? formValues[googleAPIParams.driveExpandedContentsParams.idSondaggioKey] : null;
                        const codicePart = googleAPIParams.driveExpandedContentsParams.codicePartKey ? formValues[googleAPIParams.driveExpandedContentsParams.codicePartKey] : null;
                        const syncMode = googleAPIParams.driveExpandedContentsParams.syncMode ? googleAPIParams.driveExpandedContentsParams.syncMode : "full";
                        if (!codiceAzienda) {
                            _this._toastService.showErrorToast("Missing Google Drive Expanded Contents Params");
                        }
                        else {
                            let loadingToast = _this._toastService.showLoadingToast("Synching Google Drive", "Please wait...");
                            try {
                                const googleAuth = await _this.authService.loadGoogleAuth('gdrive');

                                await _this._googleAPIService.syncGoogleDrive(googleAuth, syncMode, codiceAzienda, idAnagrafica, idProgetto, idRisorsa, idSondaggio, codicePart);

                                /*
                                // let getChangesResult = await _this._googleAPIService.getChanges(googleAuth);
                                // _this._console.log(getChangesResult);
                                // if(getChangesResult && getChangesResult.length) {
                                //     let syncDataResponse = await forkJoin(getChangesResult.map(x => _this._googleAPIService.syncGoogleDrive(googleAuth, x.codice_azienda, x.anagrafica_id, null))).toPromise();
                                // }

                                let anagrafica_contents = await _this.backendService.getGoogleDriveFolderNameByAnagrafica(codiceAzienda, idAnagrafica, _this.authService.getUsername()).toPromise();
                                _this._console.log(anagrafica_contents);
                                let anagraficaFolders = anagrafica_contents.response[0]['anagrafica_folder_name_and_sub_folders'];
                                //anagraficaFolders['root_folder'] = '0020-Amedeo Poli';
                                let sub_folders = anagraficaFolders['sub_folders'];
                                if (sub_folders && sub_folders.length > 0) {
                                    for (let i = 0; i < sub_folders.length; i++) {
                                        if (sub_folders[i]['folder'].endsWith('/')) {
                                            sub_folders[i]['folder'] = sub_folders[i]['folder'].slice(0, -1);
                                        }
                                        if (!sub_folders[i]['folder'].includes('/')) {
                                            sub_folders[i]['fileid'] = sub_folders[i]['s3Folder'] + '/' + sub_folders[i]['fileid'];
                                        }
                                    }
                                    //sub_folders = sub_folders.filter(x => !x.md5 || !x.md5.includes('null::varchar'))
                                }

                                anagraficaFolders['sub_folders'] = sub_folders;

                                _this._console.log(codiceAzienda, idProgetto, idAnagrafica, anagraficaFolders);

                                const driveFolder = anagraficaFolders['root_folder'];
                                const subFolders = anagraficaFolders['sub_folders'] || [];

                                let foldersToCheck = [driveFolder];
                                if (subFolders && subFolders.length > 0) {
                                    for await (let subFolder of subFolders) {
                                        if (!foldersToCheck.includes(subFolder.folder)) {
                                            foldersToCheck.push(subFolder.folder);
                                        }
                                    }
                                }

                                _this._console.log('foldersToCheck: ', JSON.stringify(foldersToCheck));

                                anagraficaFolders['folder_ids'] = {};
                                for await (let folderToCheck of foldersToCheck) {
                                    let fixDriveFolderPathByIdentifierResponse = await _this.backendService.fixDriveFolderPathByIdentifier(folderToCheck, googleAuth).toPromise();
                                    anagraficaFolders['folder_ids'][fixDriveFolderPathByIdentifierResponse['folder']] = fixDriveFolderPathByIdentifierResponse['folderId'];

                                }

                                // let fixDriveFolderPathByIdentifierResponse = await forkJoin(foldersToCheck.map(x => _this.backendService.fixDriveFolderPathByIdentifier(x, googleAuth))).toPromise();
                                // _this._console.log('fixDriveFolderPathByIdentifier Response: ', fixDriveFolderPathByIdentifierResponse);

                                // anagraficaFolders['folder_ids'] = {};
                                // fixDriveFolderPathByIdentifierResponse.forEach(x => {
                                //     anagraficaFolders['folder_ids'][x['folder']] = x['folderId']
                                // });

                                anagraficaFolders['codice_azienda'] = codiceAzienda;

                                _this._console.log(anagraficaFolders);
                                // let fixAnagraficaFolderByIdentifierResponse = await _this.backendService.fixAnagraficaFolderByIdentifier(anagraficaFolders, googleAuth).toPromise();
                                // _this._console.log('fixAnagraficaFolderByIdentifier Response ', fixAnagraficaFolderByIdentifierResponse);
                                // anagraficaFolders['folder_ids'] = fixAnagraficaFolderByIdentifierResponse['folderIds'];
                                // anagraficaFolders['codice_azienda'] = codiceAzienda;


                                let getDriveFolderDeepContentsResponse: any = await _this.backendService.getDriveFolderDeepContents(anagraficaFolders, googleAuth).toPromise();
                                _this._console.log('getDriveFolderDeepContentsResponse ', getDriveFolderDeepContentsResponse);

                                let syncDataResponse = await forkJoin(getDriveFolderDeepContentsResponse.syncData.map(x => _this.backendService.syncDriveS3File([x], googleAuth))).toPromise();
                                _this._console.log('syncDataResponse', syncDataResponse);

                                anagraficaFolders['root_drive_contents'] = getDriveFolderDeepContentsResponse.rootDriveContents;
                                let processDriveFolderDeepContentsResponse: any = await _this.backendService.processDriveFolderDeepContents(anagraficaFolders, googleAuth).toPromise();
                                _this._console.log('processDriveFolderDeepContentsResponse ', processDriveFolderDeepContentsResponse);


                                let filteredFilesForSetProperFileFolder = [];
                                for (let file of processDriveFolderDeepContentsResponse.files) {
                                    if (file.fileid.includes('/')) {
                                        file.fileid = file.fileid.split('/')[1];
                                    }
                                    if (filteredFilesForSetProperFileFolder.filter(x => x.fileid == file.fileid && x.filename == file.filename && x.folder == file.folder).length == 0) {
                                        filteredFilesForSetProperFileFolder.push(file);
                                    }
                                }

                                let contentsJson = {
                                    codice_azienda: codiceAzienda,
                                    id_progetto: idProgetto,
                                    id_anagrafica: idAnagrafica,
                                    files: filteredFilesForSetProperFileFolder
                                }
                                _this._console.log(contentsJson);

                                let setProperFileFolderResponse: any = await _this.backendService.setProperFileFolder(contentsJson).toPromise();
                                _this._console.log('setProperFileFolder Response: ', setProperFileFolderResponse);



                                let performDriveOperationsResponse = [];
                                if (setProperFileFolderResponse.response && setProperFileFolderResponse.response.rows && setProperFileFolderResponse.response.rows.length > 0) {
                                    for await (let operation of setProperFileFolderResponse.response.rows) {
                                        let performDriveOperationResponse = await _this.backendService.performDriveOperations([operation], googleAuth).toPromise();
                                        performDriveOperationsResponse.push(performDriveOperationResponse);
                                    }
                                    // let performDriveOperationsResponse = await forkJoin(setProperFileFolderResponse.response.rows.map(x => _this.backendService.performDriveOperations([x], googleAuth))).toPromise();
                                }

                                _this._console.log('performDriveOperations Response: ', performDriveOperationsResponse);
                                
                                */

                                _this._toastService.hideLoadingToast(loadingToast);
                                _this._toastService.showSuccessToast(event.successMessage || 'Done!');
                            }
                            catch (e) {
                                _this._console.log(e);
                                _this._toastService.hideLoadingToast(loadingToast);
                                _this._toastService.showErrorToast(e);
                            }
                        }
                    }
                }
                else {
                    _this._dialogService.showErrorDialog("Error", "You are not subscribed to use Google services");
                }
            }
            else {
                _this._toastService.showErrorToast("Missing Google API Get Email Thread Params");
            }
        }
    }

    async runRegulatEvent(event, value, keyListener) {
        let _this = this;
        const regulatAPIParams: RegulatAPIParams = event.regulatAPIParams;
        let formValues = _this.formArray.first.form.value;

        // process the booleans (1/0 instead of true/false)
        for (const value in formValues) {
            if (formValues.hasOwnProperty(value)) {
                const element = formValues[value];
                if (element == null) {
                    continue; // skip null entries
                }
                // decode combos
                if (element['id'] != null) {
                    formValues[value] = element['id'];
                }
                // encode boolean
                else if (element === true) {
                    formValues[value] = '1';
                }
                else if (element === false) {
                    formValues[value] = '0';
                }
            }
        }

        if (!regulatAPIParams || !regulatAPIParams.actionType) {
            _this._toastService.showErrorToast("Missing Regulat API params");
        }
        else {
            if (_this.authService.getOneKYCAuth()) {
                if (regulatAPIParams.actionType === 'get_aml_scan') {
                    if (!regulatAPIParams.entityParams) {
                        _this._toastService.showErrorToast("Missing Regulat API entity params");
                    }
                    else {
                        let loadingToast = _this._toastService.showLoadingToast("Running OneKYC", "Please wait, it may takes a few minutes");
                        //_this._dialogService.showLoadingDialog('Running OneKYC', 'Please wait...');

                        const codiceAziendaAML = formValues[regulatAPIParams.entityParams.codice_azienda];
                        const idAnagraficaAML = formValues[regulatAPIParams.entityParams.id_anagrafica];
                        const idSomministrazioneAML = formValues[regulatAPIParams.entityParams.id_somministrazione];
                        const dynamoUserAML = formValues[regulatAPIParams.entityParams.dynamo_user];
                        const isLightScan = regulatAPIParams.entityParams.is_light_scan;

                        //First step, get connected registries
                        let connected_registries = await _this.backendService.getConnectedRegistries(codiceAziendaAML, idAnagraficaAML).toPromise();
                        _this._console.log(connected_registries.response);

                        if (connected_registries.response === 'KO') {
                            _this._console.log('KO');
                            _this._toastService.hideLoadingToast(loadingToast);
                            //_this._dialogService.closeDialog();
                            _this.showErrorToast(connected_registries.reason);
                        }
                        else {

                            let connectedRegistries = connected_registries.response;

                            //Second step, query regulat.io
                            let scan_contents = await _this.backendService.getAmlScan(codiceAziendaAML, connectedRegistries, idSomministrazioneAML, dynamoUserAML, isLightScan).toPromise();
                            _this._console.log(scan_contents);

                            _this._toastService.hideLoadingToast(loadingToast);
                            //_this._dialogService.closeDialog();
                            _this._toastService.showSuccessToast('OneKYC: Completed!'); // show success toast
                            this.refreshView(); // refresh the view
                        }
                    }
                }
                else if (regulatAPIParams.actionType === 'get_aml_scans') {
                    if (!regulatAPIParams.surveyParams) {
                        _this._toastService.showErrorToast("Missing Regulat API survey params");
                    }
                    else {
                        let loadingToast = _this._toastService.showLoadingToast("Running OneKYC", "Please wait, it may takes a few minutes");
                        //_this._dialogService.showLoadingDialog('Running OneKYC', 'Please wait...');

                        const codiceAziendaAML = formValues[regulatAPIParams.surveyParams.codice_azienda];
                        const idSondaggioAML = formValues[regulatAPIParams.surveyParams.id_sondaggio];
                        const dynamoUserAML = formValues[regulatAPIParams.surveyParams.dynamo_user];
                        const isLightScan = regulatAPIParams.surveyParams.is_light_scan;

                        //First step, get connected registries
                        let connected_checks = await _this.backendService.getConnectedChecks(codiceAziendaAML, idSondaggioAML).toPromise();
                        _this._console.log(connected_checks.response);

                        if (connected_checks.response === 'KO') {
                            _this._console.log('KO');
                            _this._toastService.hideLoadingToast(loadingToast);
                            //_this._dialogService.closeDialog();
                            _this.showErrorToast(connected_checks.reason);
                        }
                        else {

                            let connectedChecks = connected_checks.response;

                            for (let i = 0; i < connectedChecks.length; i++) {

                                _this._console.log(connectedChecks[i].id_somministrazione);

                                //First step, get connected registries
                                let connected_registries = await _this.backendService.getConnectedRegistriesFromCheck(codiceAziendaAML, connectedChecks[i].id_somministrazione).toPromise();
                                _this._console.log(connected_registries.response);

                                if (connected_registries.response === 'KO') {
                                    _this._console.log('KO');
                                    _this._toastService.hideLoadingToast(loadingToast);
                                    //_this._dialogService.closeDialog();
                                    _this._toastService.showErrorToast(connected_registries.reason);
                                    return;
                                }
                                else {

                                    let connectedRegistries = connected_registries.response;

                                    //Second step, query regulat.io
                                    let scan_contents = await _this.backendService.getAmlScan(codiceAziendaAML, connectedRegistries, connectedChecks[i].id_somministrazione, dynamoUserAML, isLightScan).toPromise();
                                    _this._console.log(scan_contents);

                                }
                            }
                            _this._toastService.hideLoadingToast(loadingToast);
                            //_this._dialogService.closeDialog();
                            _this._toastService.showSuccessToast('OneKYC: Completed!'); // show success toast
                            this.refreshView(); // refresh the view
                        }
                    }
                }
                else {
                    _this._toastService.showErrorToast("Missing Regulat Api Params");
                }
            } else {
                _this._console.error("You are not subscribed to use OneKYC service");
                _this._dialogService.showErrorDialog("Missing authorization", "You are not subscribed to use OneKYC service");
            }
        }
    }

    reload() {
        this._console.log('onReload: form-getter');
        this.clearForm();
        this.onReload.emit();
    }

    clearForm() {
        this.filteredFormData = [];
        this.quickAddData = [];

        this.cdRef.detectChanges();
    }

    applyFilter() {
        let _this = this;
        if (_this.results && _this.results.length) {
            if (_this.filter) {
                var filteredResults = _this.results.filter(entry => {
                    var add = true;
                    var done = false;

                    if (entry && Object.entries(entry).length) {
                        // Since we will use fullValueSet, we don't need to read all fields
                        for (const [key, value] of Object.entries(entry)) {
                            // _this._console.log(key, value);
                            if (value && !done) {
                                let dataType = typeof (value);
                                if (dataType == 'string' || dataType == 'number') {
                                    let data: string = '' + value;
                                    if (data && data.toLowerCase().includes(_this.filter)) {
                                        add = true;
                                        done = true;
                                    }
                                    else {
                                        add = false;
                                        done = false;
                                    }

                                }
                                else if (value.constructor == Object) {
                                    let comboField: any = value;
                                    if (comboField.options && comboField.options.length && comboField.value) {
                                        let selectedItem = comboField.options.filter(x => x.id == comboField.value)[0];
                                        if (selectedItem.name && selectedItem.name.toLowerCase().includes(_this.filter)) {
                                            add = true;
                                            done = true;
                                        }
                                        else {
                                            add = false;
                                            done = false;
                                        }
                                    }
                                    // Combobox
                                    // code here...
                                }
                            }
                        }

                    }
                    return add;
                });

                _this.processResults(filteredResults);
            }
            else {
                _this.processResults(_this.results);
                // _this.filteredFormData = JSON.parse(JSON.stringify(_this.formData));
            }
            _this.process_form(_this.filteredFormData);
        }

    }

    findElementInDynamicFields(dynamicFields: QueryList<DynamicFieldDirective> | QueryList<SubFormDynamicFieldDirective>, name: string) {
        let element = null;

        dynamicFields.forEach(dynamicField => {
            if (dynamicField.field.name === name) {
                element = dynamicField;
            }
            if (dynamicField.componentRef.instance instanceof SubformComponent && !element) {

                let findResult = this.findElementInDynamicFields((<SubformComponent>dynamicField.componentRef.instance).dynamicFields, name);
                if (findResult) {
                    element = findResult;
                }
            }
        });
        return element;
    }

    getFormValues(): any {
        const _this = this;
        if (this.formArray != null) {
            return HelperService.getFormValues(this.formArray.first.form.value)
        }
        return {};
    }

    // Import export stuff
    uploadCSV(): void {
        this._importExportService.importCSV(this.formParams.entryName);
    }

    importAdvanced(item: ImportItem) {
        this._importExportService.importAdvancedCSV(this.formParams.entryName, this.formParams.keys, item.label, true);
    }

    downloadTemplateFile(): void {
        this._importExportService.getTemplateFile(this.formParams.entryName);
    }

    downloadCSV() {
        const formValues = this.getFormValues();
        this._importExportService.downloadCSV(this.formParams.entryName, this.authService.getCurrentCompany(this.currentKeys), this.formParams.keys, null, true, formValues, null);
    }

    downloadAdvancedCSV(item: ExportItem): void {
        const formValues = this.getFormValues();
        this._importExportService.downloadCSV(this.formParams.entryName, this.authService.getCurrentCompany(this.currentKeys), this.formParams.keys, null, true, formValues, item.label);
    }

    downloadExcel() {
        const formValues = this.getFormValues();
        this._importExportService.downloadExcel(this.formParams.entryName, this.authService.getCurrentCompany(this.currentKeys), this.formParams.keys, null, true, formValues, null);
    }

    downloadAdvancedExcel(item: ExportItem): void {
        const formValues = this.getFormValues();
        this._importExportService.downloadExcel(this.formParams.entryName, this.authService.getCurrentCompany(this.currentKeys), this.formParams.keys, null, true, formValues, item.label);
    }

    loadWidgetsConfiguration(widgetsConfiguration: WidgetsConfigurations) {
        if (widgetsConfiguration) {
            this.widgetsConfiguration = widgetsConfiguration;
        }
        else {
            this.widgetsConfiguration = {
                attachments: {
                    onSaveAction: 'reload'
                }
            };
        }
    }

    attachmentsOnSave(result) {
        if (result && this.widgetsConfiguration.attachments.onSaveAction == 'reload') {
            this.refreshView();
        }
    }

    trackItems(index: number, item: any) {
        return index;
    }
}

