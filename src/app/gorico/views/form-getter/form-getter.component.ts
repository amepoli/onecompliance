import { Component, Input, Output, EventEmitter, OnChanges, ViewChildren, QueryList, AfterViewInit, OnDestroy, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { DynamicFormComponent } from 'app/gorico/dynamic-forms/components/dynamic-form/dynamic-form.component';
import { FieldConfig, FieldInputEvent } from 'app/gorico/dynamic-forms/field.interface';
import { BackendService } from '../backend/backend.service';
import { PubSubService } from 'app/gorico/services/pubsub.service';
import { ComboboxComponent } from 'app/gorico/dynamic-forms/components/combobox/combobox.component';
import { Subscription } from 'rxjs';
import { AuthService } from 'app/gorico/login-page/auth.service';
import { ToastService } from 'app/gorico/services/toast.service';
import { DialogService } from 'app/gorico/services/dialog.service';
import { ValidationsService } from 'app/gorico/services/validations.service';
import { ImportExportService } from 'app/gorico/services/import_export.service';
import { NavigationService } from 'app/gorico/services/navigation.service';

import { MessageView } from 'app/gorico/services/messages.service';
import { HelperService } from 'app/gorico/services/helper.service';
import { ConsoleLoggerService } from 'app/gorico/services/console_logger.service';

export type formDataType = 'text' | 'date' | 'number' | 'boolean';

export type formViewType = 'input' | 'textarea' | 'combobox' | 'invisible' | 'checkbox' | 'radiobutton' | 'checkboxgroup' | 'button' | 'subform';

export type eventActionType = 'show' | 'update' | 'query' | 'update_style' | 'query_style';

export type eventTriggerType = 'change' | 'focus' | 'blur';

export interface formViewKey { // as per API specification
    isHidden: boolean;
    autoGenerate?: boolean;
    readOnly: boolean;
    isPrimary: boolean;
    isVisible: boolean;
    isLevel?: boolean;
    hasLevel?: boolean;
    newLine: boolean;
    textareaHeight?: 'S' | 'M' | 'L' | 'XL';
    buttonIcon?: string;
    confirmButtonAction?: boolean;
    isDownloadButton?: boolean;
    size?: number;
    style?: {
        background_color?: string,
        font_color?: string
    };
    key: string;
    label: string;
    subKeys?: [
        {
            key: string,
            dataType: formDataType
        }
    ];
    outputEvent?: {
        eventName: string,
        eventTrigger?: eventTriggerType,
        conditionalQuery?: string
    };
    inputEvents?: FieldInputEvent[];
    format: {
        viewType: formViewType,
        dataType?: formDataType,
        value?: any,
        options: [
            {
                id: number,
                name: string
            }
        ],
        comboQuery?: string,
        validations?: [
            {
                message: string,
                name: string,
                validator: string,
                value?: string
            }
        ],
        subform_keys?: formViewKey[];
    };
}

export interface OutputEvent {
    'eventName': string,
    'eventTrigger': 'onSave' | 'onReload'
}

export interface formGetterParams {
    entryName: string;
    keys: any;
    isNew: boolean;
    isVisible: boolean;
}

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

    @Input() filter: string;
    @Input() formParams: formGetterParams = null;
    @Output() sendEvent = new EventEmitter<any>();
    @Output() onReload = new EventEmitter<any>();

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

    numRows = 1;

    @Output() onMessagesUpdated: EventEmitter<MessageView[]> = new EventEmitter();

    viewKeys: formViewKey[]; // view form fields as specified by the backend
    formRowProperties: any[];

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

    constructor(
        private cdRef: ChangeDetectorRef,
        private backendService: BackendService,
        private pubSubService: PubSubService,
        private authService: AuthService,
        private _toastService: ToastService,
        private _dialogService: DialogService,
        private _importExportService: ImportExportService,
        private _navigationService: NavigationService,
        private _console: ConsoleLoggerService
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
            c => { // publish when last element has been shown
                if (_this.formParams && !_this.formParams.isNew && _this.formArray.length) {
                    _this.runOnReloadEvents();
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

    }

    ngOnDestroy() {
        this.generalSubscriptions.forEach(subscription => {
            subscription.unsubscribe();
        });

        this.formSubscriptions.forEach(subscription => {
            subscription.unsubscribe();
        });
    }

    public resetPagination(){
        if (this.filteredFormData && this.filteredFormData.length){
            this.pagination = {
                curPage: 1,
                curRecords: [],
                totalPages: Math.ceil(this.filteredFormData.length / this.recordsPerPage)
            };
            this.updatePagination(0);
        }
        else{
            this.pagination = {
                curPage: 1,
                curRecords: [],
                totalPages: 1
            };
        }
    }

    public updatePagination(pageInc: number = 0){
        let curPage = (this.pagination.curPage + pageInc > 0 && this.pagination.curPage + pageInc <= this.pagination.totalPages) ? this.pagination.curPage + pageInc : this.pagination.curPage;

        let start = (curPage - 1) * this.recordsPerPage;
        let end = Math.min( this.filteredFormData.length, start + this.recordsPerPage);

        let curRecords = [];
        for (let i = start; i < end; i++){
            curRecords = [...curRecords, i];
        }
        
        //let curRecords = Array(Math.min(this.recordsPerPage,  + ).map((v, i) => ((this.pagination.curPage -1) * this.pagination.recordsPerPage) + i);
        this.pagination.curPage = curPage;
        this.pagination.curRecords = curRecords;
    
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

    refreshView(reloadEvents: boolean = true) {
        const _this = this;
        _this.isLoading = true;
        _this.sendEvent.emit({ eventType: 'searchKeys', queryParams: { keys: null } }); // pass search keys to parent view 
    
        const subscription = _this.backendService.getView(_this.formParams.entryName, _this.authService.getCurrentCompany(_this.currentKeys), _this.formParams.keys).subscribe(
            results => {
                _this._console.log(results);
                if (results.result === 'OK') {
                    const params = results.data;
                    _this.viewKeys = params.form_keys;
                    if (_this.viewKeys == null) {
                        return;                         // no formKeys defined for the table, stop here
                    }

                    // Load Hide actions if available
                    _this.hideActions = _this._navigationService.getFormHideActions(params.hideActions);
                    
                    // Profile hide actions
                    if(params.profileHideActions) {
                        _this.hideActions = _this.hideActions.concat(params.profileHideActions);
                    }

                    if (_this.isFormView && !_this.isTabMode) {
                        
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
                    _this._navigationService.onDashboardTableLoad.emit({origin: _this.formParams.entryName, dashboardTables: params.dashboardTables});

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
                    _this.sendEvent.emit({ eventType: 'formData', viewKeys: _this.currentKeys, tabKeys: params.subTables });
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
                }
                else {
                    // Show error snackbar
                    _this._toastService.showErrorToast(results.reason);
                }
            });
        _this.generalSubscriptions.push(subscription);
    }

    sendEmail(data: any) {
        const _this = this;

        if (data.templateKey) {
            _this.backendService.sendEmailUsingTemplate(data);
        } else {
            const subscription = _this.backendService.sendEmail(data.subject, data.header, data.query, data.footer, data.company, data.conditionQuery, data.onSuccessQuery, data.to, data.cc)
            .subscribe(
                result => {
                    _this._console.log(result);
                    if (result.Success) {
                        _this._toastService.showSuccessToast(result.Message);
                    }
                    else {
                        _this._toastService.showErrorToast(result.Error);
                    }

                }, error => {
                    _this._toastService.showErrorToast(error);

                }
            );
            _this.generalSubscriptions.push(subscription);
        }
    }

    subscribeFieldInputEvents(viewKeys: formViewKey[]): void {
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
                        _this.eventCallback({actionType: 'combo_lazy_loading'}, value, value.data); 
                    });
                _this.formSubscriptions.push(lazy_subscription);
            }
            if (key.format.viewType === 'subform' && key.format.subform_keys != null) {
                _this.subscribeFieldInputEvents(key.format.subform_keys);
            }
        }
    }

    getCurrentKeys(validKeysArray: formViewKey[], inputKeys: any) {

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
                    else if (element.value != null){
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

        const subscription = _this.backendService.getData(_this.formParams.entryName, _this.authService.getCurrentCompany(_this.currentKeys), _this.currentKeys, null, true, _this.formParams.isNew, null, false).subscribe(
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

                    // Stop loading
                    _this.isLoading = false;
                }
                else {
                    // Show error snackbar
                    _this._toastService.showErrorToast(results.reason);

                    // Set results empty
                    _this.results = [];
                    _this.processResults(_this.results);

                    // Stop loading
                    _this.isLoading = false;
                }
            },
            error => {
                _this._toastService.showErrorToast(error);

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
        const subscription = _this.backendService.getData(_this.formParams.entryName, _this.authService.getCurrentCompany(_this.currentKeys), _this.currentKeys, null, true, true, null, false).subscribe(
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
                    
                    if (_this.filteredFormData && _this.filteredFormData.length){
                        _this.filteredFormData.unshift(filteredFormData[0]);
                        _this.quickAddData.unshift(true);
                    }
                    else{
                        _this.filteredFormData = filteredFormData;
                        _this.quickAddData = [true];
                    }
                    // add it to the top of the list
                    _this.resetPagination();

                }
                else {
                    // Show error snackbar
                    _this._toastService.showErrorToast(result.reason);
                }
                _this.isAddingNew = false;
            },
            error => {
                _this._toastService.showErrorToast(error);
                _this.isAddingNew = false;
            });
        _this.generalSubscriptions.push(subscription);
    }

    private getFormData(formKeys: formViewKey[], values: any, startingIndex = 0): FieldConfig[][] {

        const fieldValuesArray: FieldConfig[][] = [[]];

        for (let index = 0; index < values.length; index++) {
            fieldValuesArray[index] = this.getFieldValues(formKeys, values, index + startingIndex);
        }
        return fieldValuesArray;

    }

    private getSubKeysObject(subKeys: [{ key: string, dataType: formDataType }], commaSeparatedValues: string): any {
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

    private getFieldValues(formKeys: formViewKey[], values: any, index: number): FieldConfig[] {
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

    private getFieldValue(field: formViewKey, element: any, values: any, index: number): FieldConfig {
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
                name: field.key,
                type: field.format.viewType,
                index: index,
                fullValueSet: values[index],
                value: (element != null) ? ((element.options != null) ? element.value : element) : null,
                inputType: (field.format.dataType != null) ? field.format.dataType : 'text',
                readonly: (attribute != null && attribute.readOnly != null && attribute.readOnly[index] != null) ? attribute.readOnly[index] : _this.isReadOnly ? true : (field.readOnly != null) ? field.readOnly : false,
                isVisible: (attribute != null && attribute.isHidden != null && attribute.isHidden[index] != null) ? !attribute.isHidden[index] : field.isHidden != null ? !field.isHidden : true,
                newLine: (field.newLine != null) ? field.newLine : true,
                textareaHeight: (field.textareaHeight != null) ? field.textareaHeight : 'S',
                buttonIcon: (field.buttonIcon != null) ? field.buttonIcon : null,
                confirmButtonAction: (field.confirmButtonAction != null) ? field.confirmButtonAction : false,
                isDownloadButton: (field.isDownloadButton != null) ? field.isDownloadButton : false,
                style: attributeStyle != null ? Object.assign(field.style, attributeStyle) : (field.style != null) ? field.style : null,
                width: (field.size != null) ? (field.size * 10) : null, // leave a 1% margin left and right   
                options: (element != null && element.options != null) ? element.options : [],
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
            console.log(`Field: ${fieldValue.label} has new line.`);
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
        // console.log(`keyListener: ${keyListener}`);
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

        if (event.condition === 'equalTo') {
            // normalize if boolean conditions
            let eventValues = event.values.map(v => v === 'true' ? '1' : v === 'false' ? '0' : v);
            let msgData = Array.isArray(value.data) ? value.data : [value.data];
            msgData = msgData.map(m => m === true || m === 'true' || m === 't' ? '1' : m === false || m === 'false' || m === 'f' ? '0' : m);
            // handle jolly chars 
            eventValues = eventValues.map(e => e === '*' ? msgData[eventValues.indexOf(e)] : e);
            // tricky way to compare two arrays
            conditionMet = JSON.stringify(eventValues) === JSON.stringify(msgData);
        }

        if (event.actionType === 'show' || event.actionType === 'hide' || event.actionType === 'toggle') {
            // get the listener element if not full table
            let listener: FieldConfig = null;
            if (keyListener != null && value.type !== 'page') {
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
                        if (typeof(value.data) === 'object' && value.data['keys'] && value.data['keys'][element.source]){
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
                const subscription = _this.backendService.postEvent(_this.formParams.entryName, _this.authService.getCurrentCompany(_this.currentKeys), _this.currentKeys, keyListener, chiavi, event.eventName, event.actionType).subscribe(
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
                                    combobox.setOptions(result.options, true);
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
                                            if (combobox){
                                                combobox.setValue(result[0][k]);
                                            }
                                            else{
                                                // It's not a combobox so set value directly
                                                el.value = result[0][k];
                                            }
                                        }
                                    }
                                }
                            } else if (event.actionType === 'combo_lazy_loading') {
                                let combobox: ComboboxComponent = null;
                                combobox = <ComboboxComponent>current_line.dynamicFields.find(df => df.field.name === keyListener).componentRef.instance;
                                const comboValue = combobox.field.value != null ? combobox.field.value.id : null;
                                combobox.setOptions(result, true);
                                if (comboValue != null) {
                                    combobox.setValue(comboValue);
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
                            if (event.outputEventWhenComplete != null) {
                                _this.pubSubService.publishEvent(event.outputEventWhenComplete, value);
                            }
                        }
                        else {
                            // Show error snackbar
                            _this._console.log(`keyListener: ${keyListener}`);
                            //console.table(result);

                            _this._console.log(result);
                            _this._toastService.showErrorToast(result.reason);
                        }
                    });

                _this.generalSubscriptions.push(subscription);
            }
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
        }
        else if (event.actionType === 'show_message' && conditionMet && event.message) {
            // Show confirmation dialog
            _this._dialogService.showConfimationDialog('Confirm', event.message.messageText, 'Yes', 'No', 'info').then((result) => {
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
                else if (actionType === 'email') {
                    _this.sendEmail({ templateKey: 'test' });
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
                        const subscription = _this.backendService.postEvent(_this.formParams.entryName, _this.authService.getCurrentCompany(_this.currentKeys), _this.currentKeys, keyListener, chiavi, event.eventName, action, true).subscribe(
                            result => {
                                if (result.result === 'OK') {
                                    _this._console.table(result);
                                    if (result.data ){
                                        if (Array.isArray(result.data)){
                                            // I am hoping that the result contains keys for the next event
                                            value.data = {};
                                            value.data['keys'] = result.data[0];
                                        }
                                        else{
                                            value.data = result.data;
                                        }
                                    }
                                    
                                    if (event.successMessage){
                                        _this._toastService.showSuccessToast(event.successMessage);
                                    }
                                    else{
                                        _this._toastService.showSuccessToast('Success!');
                                    }
                                    if (event.outputEventWhenComplete != null) {
                                        _this.pubSubService.publishEvent(event.outputEventWhenComplete, value);
                                    }
                                }
                                else {
                                    _this._console.table(result);
                                    _this._toastService.showErrorToast(result.reason);
                                }
                            });

                        _this.generalSubscriptions.push(subscription);
                    }
                }
            });


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
                            // console.log(key, value);
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
}

