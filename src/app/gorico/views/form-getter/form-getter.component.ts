import { Component, Input, Output, EventEmitter, OnChanges, ViewChildren, QueryList, AfterViewInit, OnDestroy, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { DynamicFormComponent } from 'app/gorico/dynamic-forms/components/dynamic-form/dynamic-form.component';
import { FieldConfig, FieldInputEvent } from 'app/gorico/dynamic-forms/field.interface';
import { BackendService } from '../backend/backend.service';
import { Validators } from '@angular/forms';
import { NgxPubSubService } from '@pscoped/ngx-pub-sub';
import { ComboboxComponent } from 'app/gorico/dynamic-forms/components/combobox/combobox.component';
import { Subscription } from 'rxjs';
import { AuthService } from 'app/gorico/login-page/auth.service';
import { ToastService } from 'app/gorico/services/toast.service';
import { DialogService } from 'app/gorico/services/dialog.service';
import { ImportExportService } from 'app/gorico/services/import_export.service';
import { NavigationService, HideAction } from 'app/gorico/services/navigation.service';
import { MessageView } from 'app/gorico/services/messages.service';

export type formDataType = 'text' | 'date' | 'number' | 'boolean';

export type formViewType = 'input' | 'textarea' | 'combobox' | 'checkbox' | 'radiobutton' | 'checkboxgroup' | 'button' | 'subform';

export type eventActionType = 'show' | 'update' | 'query' | 'update_style' | 'query_style';

export type eventTriggerType = 'change' | 'focus' | 'blur';

export interface formViewKey { // as per API specification
    isHidden: boolean;
    autoGenerate?: boolean;
    readOnly: boolean;
    isPrimary: boolean;
    newLine: boolean;
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
                validator: string
            }
        ],
        subform_keys?: formViewKey[];
    };
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

    @Input() filter: string;
    @Input() formParams: formGetterParams = null;
    @Output() sendEvent = new EventEmitter<any>();
    @Output() onReload = new EventEmitter<any>();

    @ViewChildren(DynamicFormComponent) formArray: QueryList<DynamicFormComponent>;

    // Contains form Data
    filteredFormData: FieldConfig[][];

    isLoading = false;

    isReadOnly = false;

    hiddenRows: boolean[] = [];

    readonlyRows: boolean[] = [];

    numRows = 1;

    @Output() onHideActionsUpdated: EventEmitter<HideAction[]> = new EventEmitter();
    @Output() onMessagesUpdated: EventEmitter<MessageView[]> = new EventEmitter();

    viewKeys: formViewKey[]; // view form fields as specified by the backend
    viewProperties: any[];

    currentKeys: any; // relevant keys passed by the parent component 

    outputEvent: string; // event to be published to PubSub after (re)loading the table values
    eventTrigger: string = null;

    subscriptions: Subscription[] = [];

    results: any[] = null;

    attributes: any[] = null;

    private firstRefresh = true;

    private addingNew = false;   // avoid to trigger a refresh (with related events) when adding a row  

    private margins = 2; // % of margins, considering left and right

    constructor(
        private cdRef: ChangeDetectorRef,
        private backendService: BackendService,
        private pubsubService: NgxPubSubService,
        private authService: AuthService,
        private _toastService: ToastService,
        private _dialogService: DialogService,
        private _importExportService: ImportExportService,
        private _navigationService: NavigationService,
    ) { }

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
                    this.refreshView();
                }
            }
            else {
                this.addingNew = false;
            }
        } else {
            this.clearForm();
        }
    }

    ngAfterViewInit() {
        const _this = this;
        // check and in case publish a table event on PubSub
        _this.formArray.changes.subscribe(
            c => { // publish when last element has been shown
                if (this.formParams && !_this.formParams.isNew && _this.outputEvent != null && _this.formArray.length && (!_this.eventTrigger || _this.eventTrigger === 'onReload')) {
                    // tslint:disable-next-line: max-line-length
                    _this.pubsubService.publishEvent(_this.outputEvent, { origin: 'table', index: 0, data: _this.filteredFormData, type: 'page' });
                }
            }
        );
    }

    ngOnDestroy() {
        this.subscriptions.forEach(subscription => {
            subscription.unsubscribe();
        });
    }

    refreshView() {
        const _this = this;
        _this.isLoading = true;

        _this.backendService.getView(_this.formParams.entryName, _this.authService.getCurrentCompany(), _this.formParams.keys).subscribe(
            results => {
                console.log(results);
                if (results.result === 'OK') {
                    const params = results.data;

                    _this.viewKeys = params.form_keys;
                    if (_this.viewKeys == null) {
                        return;                         // no formKeys defined for the table, stop here
                    }
                    // Load Export Queries list if available
                    if (params.exportQueries && params.exportQueries.formQueries) {
                        console.log('exportQueries', params.formQueries);
                        _this._importExportService.updateExportList(_this.formParams.entryName, params.exportQueries.formQueries);
                    }
                    else {
                        _this._importExportService.updateExportList(_this.formParams.entryName, []);
                    }

                    // Load Hide actions if available
                    if (params.hideActions) {
                        _this.onHideActionsUpdated.emit(params.hideActions);
                    }
                    else {
                        _this.onHideActionsUpdated.emit([]);
                    }

                    // Load Messages if available
                    if (params.messages) {
                        _this.onMessagesUpdated.emit(params.messages);
                    }
                    else {
                        _this.onMessagesUpdated.emit([]);
                    }
                    console.log(params.messages);

                    // Get View properties if exist
                    _this.viewProperties = params.view_properties;
                    if (_this.viewProperties && _this.viewProperties.length) {
                        _this.viewProperties.forEach(viewProperty => {
                            // Subscribe to all the input Events
                            if (viewProperty.inputEvents && viewProperty.inputEvents.length) {
                                viewProperty.inputEvents.forEach(event => {
                                    const subcription = _this.pubsubService.subscribe(event.eventName,
                                        value => {
                                            _this.eventCallback(event, value, null); // null as keyListener means that the full table is affected
                                        });
                                    _this.subscriptions.push(subcription);
                                });
                            }
                        });
                    }

                    _this.currentKeys = _this.getCurrentKeys(_this.viewKeys, _this.formParams.keys);
                    _this.sendEvent.emit({ eventType: 'formData', viewKeys: _this.currentKeys, tabKeys: params.subTables });
                    // handle input events
                    if (_this.firstRefresh) {
                        _this.firstRefresh = false;     // avoid to subscribe to events again when refreshed
                        if (params.inputEvents != null) {  // subscribe to global table events
                            params.inputEvents.forEach(event => {
                                const subcription = _this.pubsubService.subscribe(event.eventName,
                                    value => {
                                        _this.eventCallback(event, value, null); // null as keyListener means that the full table is affected
                                    });
                                _this.subscriptions.push(subcription);
                            });
                        }
                        _this.viewKeys.forEach(key => {    // subscribe to single field events
                            if (key.inputEvents != null) {
                                key.inputEvents.forEach(event => {
                                    const subscription = _this.pubsubService.subscribe(event.eventName, value => {
                                        _this.eventCallback(event, value, key.key);
                                    });
                                    _this.subscriptions.push(subscription);
                                });
                            }
                        });
                    }
                    // take note of global table output event if any
                    if (params.outputEvent != null) {
                        _this.outputEvent = params.outputEvent.eventName;

                        // Check if there's any event Trigger
                        if (params.outputEvent.eventTrigger) {
                            console.log('Output Event:');
                            console.table(params.outputEvent);
                            _this.eventTrigger = params.outputEvent.eventTrigger;
                        }
                        else {
                            _this.eventTrigger = null;
                        }
                    }
                    // load the form 
                    _this.loadTableData();
                }
                else {
                    // Show error snackbar
                    _this._toastService.showErrorToast(results.reason);
                }
            });

    }

    getCurrentKeys(validKeysArray: formViewKey[], inputKeys: any) {

        const outputKeys = {};
        for (const key in inputKeys) {
            if (inputKeys.hasOwnProperty(key)) {
                const element = inputKeys[key];
                if (validKeysArray != null && validKeysArray.find(e => e.key === key)) {
                    if (element == null || element.id == null) {
                        outputKeys[key] = element;
                    }
                    else if (element.id != null) {
                        outputKeys[key] = element.id;
                    }
                }
            }
        }

        return outputKeys;
    }

    loadTableData(): void {

        const _this = this; // useful to debug
        _this.isLoading = true;

        _this.backendService.getData(_this.formParams.entryName, _this.authService.getCurrentCompany(), _this.currentKeys, null, true, _this.formParams.isNew, null, false).subscribe(
            results => {
                console.log(results);
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
    }

    processResults(results): void {
        const _this = this;
        _this.numRows = results.length;

        // prepare the form
        _this.filteredFormData = _this.numRows === 0 ? [] : JSON.parse(JSON.stringify(_this.getFormData(_this.viewKeys, results)));

        // process the form
        _this.process_form(_this.filteredFormData);

        // emit event for the parent
        _this.sendEvent.emit({ eventType: 'updateData', data: _this.filteredFormData });
    }

    addRow(default_keys: any): void {
        const _this = this;
        _this.backendService.getData(_this.formParams.entryName, _this.authService.getCurrentCompany(), _this.currentKeys, null, true, true, null, false).subscribe(
            result => {
                console.log(result);
                if (result.result === 'OK') {
                    result = result.data;
                    // add passed keys, if any - useful to valorize father's keys in subtables
                    if (default_keys != null) {
                        result.forEach(element => {
                            element = Object.assign(element, default_keys);
                        });
                    }
                    // update the status to prevent the whole table refresh
                    _this.addingNew = true;

                    // process the new row
                    const filteredFormData = _this.getFormData(_this.viewKeys, result);
                    _this.process_form(filteredFormData);

                    // add it to the top of the list
                    _this.filteredFormData.unshift(filteredFormData[0]);


                }
                else {
                    // Show error snackbar
                    _this._toastService.showErrorToast(result.reason);
                }
            });
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
        // field is of type '(key1,key2)', get the array
        const subKeysArray = commaSeparatedValues.split('(')[1].split(')')[0].split(',');
        subKeys.forEach((subKey, sub_index) => {
            outputObject[subKey.key] = subKeysArray[sub_index];
        });
        return outputObject;
    }

    private getFieldValues(formKeys: formViewKey[], values: any, index: number): FieldConfig[] {
        const _this = this;
        const fieldValues = new Array();
        formKeys.forEach(field => {
            if (field != null) {
                const element = values[index][field.key];
                // process subkeys of combos/radiobuttons/etc.
                if (field.subKeys != null && field.subKeys.length > 0) {
                    if (element.options != null) {
                        element.options.forEach(option => {
                            if (option.id != null) {
                                option.id = _this.getSubKeysObject(field.subKeys, option.id);
                            }
                        });
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
        });
        return fieldValues;
    }

    private getFieldValue(field: formViewKey, element: any, values: any, index: number): FieldConfig {
        const _this = this;
        let fieldValue: FieldConfig;

        const attribute = _this.attributes[index] != null ? _this.attributes[index][field.key] : null;

        if (field != null) {
            fieldValue = {
                label: field.label,
                name: field.key,
                type: field.format.viewType,
                index: index,
                fullValueSet: values[index],
                value: (element != null) ? ((element.options != null) ? element.value : element) : null,
                inputType: (field.format.dataType != null) ? field.format.dataType : 'text',
                readonly: (attribute != null && attribute.readOnly != null) ? attribute.readOnly : _this.isReadOnly ? true : (field.readOnly != null) ? field.readOnly : false,
                isVisible: (attribute != null && attribute.isHidden != null) ? !attribute.isHidden : field.isHidden != null ? !field.isHidden : true,
                newLine: (field.newLine != null) ? field.newLine : true,
                buttonIcon: (field.buttonIcon != null) ? field.buttonIcon : null,
                confirmButtonAction: (field.confirmButtonAction != null) ? field.confirmButtonAction : false,
                isDownloadButton: (field.isDownloadButton != null) ? field.isDownloadButton : false,
                style: (attribute != null && attribute.style != null) ? attribute.style : (field.style != null) ? field.style : null,
                width: (field.size != null) ? (field.size * 10) - _this.margins : null, // leave a 1% margin left and right   
                options: (element != null && element.options != null) ? element.options : [],
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
            if (result['validations']) {
                for (const validator of result['validations']) {
                    if (validator['name'] === 'required') {
                        validator['validator'] = Validators.required;
                    }
                    if (validator['name'] === 'pattern') {
                        validator['validator'] = Validators.pattern(validator['validator']);
                    }
                }
            }
            if (result.width == null && result.subform == null) {     // if null, must be null for all elements on the same line, then split the width equally
                if (result['newLine'] === false) {
                    sameLineElements.push(result);
                } else {
                    result.width = this.processInlineElements(sameLineElements, margins);
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

        const numElements = 1 + elements.length; // current + previouses
        let sumWidths = 0;
        if (elements.length) { // some elements to put on the same line
            // process the elements with defined 1/10 size first
            const singleWidth = Math.floor(100 / numElements);
            for (const element of elements) {
                element.width = singleWidth - margins; // considering 4% margins;
                sumWidths += singleWidth;
            }
        }
        return (100 - margins - sumWidths); // considering 4% margins
    }

    private replaceLocalKeys(functString: string, keys: any): string {
        const delimiter = '£';
        // tslint:disable-next-line: forin
        for (const key in keys) {
            const toReplace = delimiter + key + delimiter;
            const replacement = keys[key];
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
        console.log(event, value, keyListener);

        // check  if this is a viewProperties event
        if (event.actionType === 'showView' && event.condition === 'equalTo') {

            // Check if view_properties contains keys 
            if (event.keys != null) {
                // Check each form table line to see if the condition is met
                _this.filteredFormData.forEach((formKeys, i) => {

                    let matchingKeys = true;
                    let matchingValues = true;

                    // Run for each key
                    event.keys.forEach(key => {

                        let senderValue;
                        const receiverEntry: any = formKeys.find(x => x.label === key.receiver);
                        const receiverValue = receiverEntry ? receiverEntry.value : key.receiver;

                        // If it's %value%, put in values variables
                        if (key.sender.includes('%value%')) {
                            senderValue = value.data;
                            if (senderValue !== receiverValue) {
                                matchingValues = false;
                            }
                        }
                        else {  // compare keys
                            senderValue = value.valueSet[key.sender] ? value.valueSet[key.sender] : key.sender;
                            if (senderValue !== receiverValue) {
                                matchingKeys = false;
                            }
                        }
                    });

                    // Perform action based on conditions check above
                    if (!matchingKeys) {
                        return; // the message is not for this row
                    }

                    _this.hiddenRows[i] = !matchingValues;

                });
            }
            return;
        }
        // not a ViewProperties event, check the condition if any -- TODO: support other conditions beyond equalTo 
        let conditionMet = true;

        if (event.condition === 'equalTo') {
            // normalize if boolean conditions
            let eventValues = event.values.map(v => v === 'true' ? '1' : v === 'false' ? '0' : v);
            let msgData = Array.isArray(value.data) ? value.data : [value.data];
            msgData = msgData.map(m => m === true || m === 1 || m === 'true' || m === 't' ? '1' : m === false || m === 0 || m === 'false' || m === 'f' ? '0' : m);
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
                    listener = targetLine.find(field => field.name === keyListener);
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
                _this.pubsubService.publishEvent(event.outputEventWhenComplete, value);
            }
        } else if (event.actionType === 'readOnly') {
            // get the listener element if not full table
            let listener: FieldConfig = null;
            if (keyListener != null && value.type !== 'page') {
                const targetLine = _this.filteredFormData[value.index];  // recover the form "line"
                if (targetLine != null) {
                    listener = targetLine.find(field => field.name === keyListener);
                }
            }
            if (keyListener == null) {   // act on the full table --> NO! view_properties must be used in this case!!!
                // _this.isReadOnly = conditionMet;
                // _this.sendEvent.emit({ eventType: 'readOnly', value: _this.isReadOnly }); // signal to the parent to show/hide save button
            } else if (listener != null) {  // act on the listening element
                listener.readonly = conditionMet;
            }
            if (event.outputEventWhenComplete != null) {
                _this.pubsubService.publishEvent(event.outputEventWhenComplete, value);
            }
        } else if (event.actionType === 'reload' && conditionMet) {
            _this.refreshView();
            if (event.outputEventWhenComplete != null) {
                _this.pubsubService.publishEvent(event.outputEventWhenComplete, value);
            }
        } else if (event.actionType === 'navigate' && conditionMet) {
            const formLine = _this.filteredFormData[value.index];
            const keys = formLine.reduce((outputKeys, key) => {
                outputKeys[key.name] = key.value;
                return outputKeys;
            }, {});
            let filteredKeys = {};
            if (event.actionTarget.keymap != null && event.actionTarget.keymap.length) { // explicit key map between tables
                event.actionTarget.keymap.forEach(element => {
                    if (element.source != null && element.destination != null) {
                        filteredKeys[element.destination] = keys[element.source] != null ? keys[element.source].id != null ? keys[element.source].id : keys[element.source] : null;
                    }
                });
            } else {
                const primaryKeys = _this.viewKeys.filter(key => key.isPrimary);
                filteredKeys = _this.getCurrentKeys(primaryKeys, keys);
            }
            _this.sendEvent.emit({ eventType: 'navigate', queryParams: { entry: event.actionTarget, keys: [filteredKeys], index: 1, total: 1 } });
            if (event.outputEventWhenComplete != null) {
                _this.pubsubService.publishEvent(event.outputEventWhenComplete, value);
            }
        } else if ((event.actionType === 'query' || event.actionType === 'query_style') && conditionMet) {
            let chiavi = {};
            const target_index = (value.type !== 'page') ? value.index : null;  // null means the event comes from the full table
            let index = (target_index == null) ? _this.formArray.length : 1;
            const targetViewField = _this.viewKeys.find(viewKey => viewKey.key === keyListener);
            const childrenArray = _this.formArray.toArray();
            // iterate over all indexes when full table or instead affect the target index only
            while (index > 0) {
                index--;
                const current_index = (target_index != null) ? target_index : index;
                chiavi = childrenArray[current_index].form.value;
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
                _this.backendService.postEvent(_this.formParams.entryName, _this.authService.getCurrentCompany(), _this.currentKeys, keyListener, chiavi, event.eventName, event.actionType).subscribe(
                    result => {
                        if (result.result === 'OK') {
                            result = result.data;
                            console.log(`keyListener: ${keyListener}`);
                            //console.table(result);
                            if (event.actionType === 'query') {
                                if (targetViewField.format.viewType === 'combobox') {   // got combobox options
                                    // _this.formArray[value.index].form.patchValue({ [keyListener]['options']: result});
                                    const combobox = <ComboboxComponent>childrenArray[current_index].dynamicFields.find(df => df.field.name === keyListener).componentRef.instance;
                                    combobox.setOptions(result);
                                } else {                                                // got field value
                                    //     childrenArray[current_index].form.patchValue({ [keyListener]: result[0][keyListener] });
                                    // Patch all the values we got from query
                                    for (var k in result[0]) {
                                        if (result[0].hasOwnProperty(k)) {
                                            // patch the form
                                            childrenArray[current_index].form.patchValue({ [k]: result[0][k] });
                                            // patch the undelying data
                                            const el = _this.filteredFormData[current_index].find(field => field.name === k);
                                            el.value = result[0][k];
                                        }
                                    }
                                }
                            } else {  // query_style
                                let element = _this.filteredFormData[current_index].find(field => field.name === keyListener);
                                if (element != null && event.styleAttribute != null) {
                                    if (element.style == null) {
                                        element.style = {};
                                    }
                                    // we can get multiple rows from backend, each one providing a different attribute, find the right one
                                    const attrKey = keyListener + '_' + event.styleAttribute; // as per specs the returned key is of type '<key>_<styleAttribute>'
                                    const actualResult = result.find(attr => attr[attrKey] != null);
                                    element.style[event.styleAttribute] = actualResult[attrKey];
                                }
                            }
                            if (event.outputEventWhenComplete != null) {
                                _this.pubsubService.publishEvent(event.outputEventWhenComplete, value);
                            }
                        }
                        else {
                            // Show error snackbar
                            console.log(`keyListener: ${keyListener}`);
                            //console.table(result);

                            console.log(result);
                            _this._toastService.showErrorToast(result.reason);
                        }
                    });
            }
        } else if ((event.actionType === 'update' || event.actionType === 'update_style') && conditionMet) {
            if (event.updateFunct != null && keyListener != null) {
                const childrenArray = _this.formArray.toArray();
                const keys = childrenArray[value.index].form.value;
                const resolvedFunct = _this.replaceLocalKeys(event.updateFunct, keys);
                // tslint:disable-next-line: no-eval
                if (event.actionType === 'update') {
                    childrenArray[value.index].form.patchValue({ [keyListener]: eval(resolvedFunct) });
                } else { // update_syle
                    const element = _this.filteredFormData[value.index].find(field => field.name === keyListener);
                    if (element != null && event.styleAttribute != null) {
                        element.style[event.styleAttribute] = eval(resolvedFunct);
                    }
                }
            }
            if (event.outputEventWhenComplete != null) {
                _this.pubsubService.publishEvent(event.outputEventWhenComplete, value);
            }
        }
        else if (event.actionType === 'show_message' && conditionMet && event.message) {
            // Show confirmation dialog
            _this._dialogService.showConfimationDialog("Confirm", event.message.messageText, "Yes", "No", "info").then((result) => {
                // Initialize with No action info
                var actionType = event.message.actionOnNo.actionType;
                var queryFunct = event.message.actionOnNo.queryFunct;

                // If user clicked yes, load yes action info 
                if (result.value === true) {
                    actionType = event.message.actionOnYes.actionType;
                    queryFunct = event.message.actionOnYes.queryFunct;
                }

                // Let's perform Yes Action
                if (actionType === 'reload') {
                    _this.reload();
                    // Reload screen
                    if (event.outputEventWhenComplete != null) {
                        _this.pubsubService.publishEvent(event.outputEventWhenComplete, value);
                    }
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
                        chiavi = childrenArray[current_index].form.value;
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
                        _this.backendService.postEvent(_this.formParams.entryName, _this.authService.getCurrentCompany(), _this.currentKeys, keyListener, chiavi, event.eventName, result ? 'actionYes' : 'actionNo', true).subscribe(
                            result => {
                                if (result.result === 'OK') {
                                    console.table(result);
                                    _this._toastService.showSuccessToast("Success!");
                                    if (event.outputEventWhenComplete != null) {
                                        _this.pubsubService.publishEvent(event.outputEventWhenComplete, value);
                                    }
                                }
                                else {
                                    console.table(result);
                                    _this._toastService.showErrorToast(result.reason);
                                }
                            });
                    }
                }
            });


        }
    }

    reload() {
        console.log('onReload: form-getter');
        this.clearForm();
        this.onReload.emit();
    }

    clearForm() {
        this.filteredFormData = [];
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
                        Object.entries(entry).forEach(([key, value]) => {
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
                            }
                        });

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

