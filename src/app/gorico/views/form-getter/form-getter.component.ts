import { Component, Input, Output, EventEmitter, OnChanges, ViewChildren, QueryList, AfterViewInit, OnDestroy } from '@angular/core';
import { DynamicFormComponent } from 'app/gorico/dynamic-forms/components/dynamic-form/dynamic-form.component';
import { FieldConfig } from 'app/gorico/dynamic-forms/field.interface';
import { BackendService } from '../backend/backend.service';
import { Validators } from '@angular/forms';
import { NgxPubSubService } from '@pscoped/ngx-pub-sub';
import { ComboboxComponent } from 'app/gorico/dynamic-forms/components/combobox/combobox.component';
import { Subscription } from 'rxjs';

export type formDataType = 'text' | 'date' | 'number' | 'boolean';

export type formViewType = 'input' | 'textarea' | 'combobox' | 'checkbox' | 'radiobutton' | 'button';

export type eventActionType = 'show' | 'update' | 'query' | 'update_style' | 'query_style';

export type eventTriggerType = 'change' | 'focus' | 'blur';

export interface formViewKey { // as per API specification
    isHidden: boolean;
    autoGenerate?: boolean;
    readOnly: boolean;
    isPrimary: boolean;
    newLine: boolean;
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
        eventTrigger?: eventTriggerType
    };
    inputEvents?: [
        {
            eventName: string,
            actionType: eventActionType,
            updateValue?: string,
            queryString?: string
        }
    ];
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
        ]
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

    @Input() formParams: formGetterParams;
    @Output() sendEvent = new EventEmitter<any>();

    @ViewChildren(DynamicFormComponent) formArray: QueryList<DynamicFormComponent>;

    formData: FieldConfig[][] = [[]];
    isLoading = true;

    numRows = 1;

    viewKeys: formViewKey[]; // view form fields as specified by the backend

    currentKeys: any; // relevant keys passed by the parent component 

    outputEvent: string; // event to be published to PubSub after (re)loading the table values

    subscriptions: Subscription[] = [];

    private firstRefresh = true;

    private addingNew = false;   // avoid to trigger a refresh (with related events) when adding a row  

    constructor(
        private backendService: BackendService,
        private pubsubService: NgxPubSubService) 
        { }

    ngOnChanges() {
        if (!this.addingNew) {
            this.refreshView();
        } else {
            this.addingNew = false;
        }
    }

    ngAfterViewInit() {
        const _this = this;
        // check and in case publish a table event on PubSub
        _this.formArray.changes.subscribe(
            c => { // publish when last element has been shown
                if (!_this.formParams.isNew && _this.outputEvent != null && _this.formArray.length) {
                        // tslint:disable-next-line: max-line-length
                        _this.pubsubService.publishEvent(_this.outputEvent, { origin: 'table', index: 0, data: _this.formData, type: 'page' }); 
                }
            }
        );
    }

    ngOnDestroy() {
        this.subscriptions.forEach( subscription => {
            subscription.unsubscribe();
        });
    }

    refreshView() {
        const _this = this;
        _this.backendService.getView(_this.formParams.entryName).subscribe(
            params => {
                _this.viewKeys = params.form_keys;
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
                }
                // load the form 
                _this.loadTableData();
            });

    }

    getCurrentKeys(validKeysArray: formViewKey[], inputKeys: any) {

        const outputKeys = {};
        for (const key in inputKeys) {
            if (inputKeys.hasOwnProperty(key)) {
                const element = inputKeys[key];
                if (validKeysArray.find(e => e.key === key)) {
                    outputKeys[key] = element;
                }   
            }
        }

        return outputKeys;
    }

    loadTableData(): void {

        const _this = this; // useful to debug
        _this.backendService.getData(_this.formParams.entryName, _this.currentKeys, null, true, _this.formParams.isNew, null).subscribe(
            results => {
                _this.isLoading = false;
                console.log(results);
                if (_this.formParams.isNew) {  // handle newly set primary keys
                    const primaryKeys = _this.viewKeys.filter(key => key.isPrimary);
                    _this.currentKeys = _this.getCurrentKeys(primaryKeys, results[0]);  // TBC why do we receive an array with one element here?
                    _this.sendEvent.emit({ eventType: 'updateKeys', viewKeys: _this.currentKeys });
                } 
                _this.numRows = results.length;
                // prepare the form
                _this.formData = _this.getFormData(_this.viewKeys, results);
                _this.process_form(_this.formData); 
                _this.sendEvent.emit({ eventType: 'updateData', data: _this.formData}); // emit event for the parent
            },
            error => {
                _this.isLoading = false;
            });
    }

    addRow(): void {
        const _this = this;
        _this.backendService.getData(_this.formParams.entryName, _this.currentKeys, null, true, true, null).subscribe(
            result => {
                // update the status to prevent the whole table refresh
                _this.addingNew = true;
                // process the new row
                const formData = _this.getFormData(_this.viewKeys, result, _this.formData.length);
                _this.process_form(formData);
                // add it to the list
                _this.formData.push(formData[0]); 
            });
    }

    private getFormData(formKeys: formViewKey[], values: any, startingIndex = 0): FieldConfig[][] {

        const fieldValues: FieldConfig[][] = [[]];

        for (let index = 0; index < values.length; index++) {
            fieldValues[index] = new Array();
            formKeys.forEach(field => {
                if (field != null) {
                    const element = values[index][field.key];
                    let fieldValue: FieldConfig;
                    if (field != null) {
                        fieldValue = {
                            label: field.label,
                            name: field.key,
                            type: field.format.viewType,
                            index: index + startingIndex,
                            value: (element != null) ? ((element.value != null) ? element.value : element) : null,
                            inputType: (field.format.dataType != null) ? field.format.dataType : 'text',
                            readonly: (field.readOnly != null) ? field.readOnly : false,
                            isVisible: (field.isHidden != null) ? !field.isHidden : true,
                            newLine: (field.newLine != null) ? field.newLine : true,
                            style: (field.style != null) ? field.style : null,
                            width: (field.size != null) ? (field.size * 10) - 4 : null, // leave a 5% margin left and right   
                            options: (element != null && element.options != null) ? element.options : [],
                            validations: (field.format.validations != null) ? field.format.validations : [],
                            eventName: (field.outputEvent != null) ? field.outputEvent.eventName : null,  // output events are directly handled by the target field component
                            eventTrigger: (field.outputEvent != null) ?  field.outputEvent.eventTrigger : null // at the moment only implemented by input element for focus/blur
                        };
                        fieldValues[index].push(fieldValue);
                    }
                }
            }); 
        }
        return fieldValues;

    }

    private process_form(input_form: FieldConfig[][]): void { // pre-process form got from back-end

        for (let index = 0; index < input_form.length; index++) {
            let sameLineElements: FieldConfig[] = [];
            for (const result of input_form[index]) {
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
                if (result.width == null) {     // if null, must be null for all elements on the same line, then split the width equally
                    if (result['newLine'] === false) {
                        sameLineElements.push(result);
                    } else {
                        result.width = this.processInlineElements(sameLineElements);
                        sameLineElements = [];
                    }
                }
            }
            this.processInlineElements(sameLineElements); // handles inline elements of last line
        }

    }

    private processInlineElements(elements: FieldConfig[]): number {

        const numElements = 1 + elements.length; // current + previouses
        let sumWidths = 0;
        if (elements.length) { // some elements to put on the same line
            // process the elements with defined 1/10 size first
            const singleWidth = Math.floor(100 / numElements);
            for (const element of elements) {
                element.width = singleWidth - 4; // considering 4% margins;
                sumWidths += singleWidth;
            }
        }
        return (100 - 4 - sumWidths); // considering 4% margins
    }

    private replaceLocalKeys(functString: string, keys: any) {
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


    // callback for pubSub events, value has form of {origin, index, data}
    private eventCallback(event: any, value: any, keyListener: string): void {
        const _this = this;
        console.log('Received event: ' + event + ' with value: ' + value);

        if (event.actionType === 'show') {
            // get the listener element if not full table
            let listener: FieldConfig = null;
            if (keyListener != null && value.type !== 'page') {
                const targetLine = _this.formData[value.index];  // recover the form "line"
                if (targetLine != null) {
                    listener = targetLine.find(field => field.name === keyListener);
                }
            }
            if (keyListener == null) {   // act on the full table
                this.formParams.isVisible = !this.formParams.isVisible;
            } else if (listener != null) {  // act on the listening element
                listener.isVisible = !listener.isVisible;
            }
        } else if (event.actionType === 'navigate') {
            const formLine = _this.formData[value.index];
            const keys = formLine.reduce((outputKeys, key) => {
                outputKeys[key.name] = key.value;
                return outputKeys;
            }, {});
            const primaryKeys = _this.viewKeys.filter(key => key.isPrimary);
            const filteredKeys = _this.getCurrentKeys(primaryKeys, keys);
            _this.sendEvent.emit({eventType: 'navigate', queryParams: {entry: event.actionTarget, keys: [filteredKeys], index: 1, total: 1}});
        } else if (event.actionType === 'query' || event.actionType === 'query_style') {
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
                _this.backendService.postEvent(_this.formParams.entryName, keyListener, chiavi, event.eventName, event.actionType).subscribe(
                    result => {
                        console.log(keyListener, result);
                        if (event.actionType === 'query') {
                            if (targetViewField.format.viewType === 'combobox') {   // got combobox options
                                // _this.formArray[value.index].form.patchValue({ [keyListener]['options']: result});
                                const combobox = <ComboboxComponent>childrenArray[current_index].dynamicFields.find(df => df.field.name === keyListener).componentRef.instance;
                                combobox.setOptions(result);
                            } else {                                                // got field value
                                childrenArray[current_index].form.patchValue({ [keyListener]: result[0][keyListener] });
                            }
                        } else {  // query_style
                            let element = _this.formData[current_index].find(field => field.name === keyListener);
                            if (element != null && event.styleAttribute != null) {
                                if (element.style == null) {
                                    element.style = {};
                                }
                                element.style[event.styleAttribute] = result[0][keyListener + '_' + event.styleAttribute]; // as per specs the returned key is of type '<key>_<styleAttribute>'
                            }
                        }
                    });
            }
        } else if (event.actionType === 'update') {
            if (event.updateFunct != null && keyListener != null) {
                const childrenArray = _this.formArray.toArray();
                const keys = childrenArray[value.index].form.value;
                const resolvedFunct = _this.replaceLocalKeys(event.updateFunct, keys);
                // tslint:disable-next-line: no-eval
                childrenArray[value.index].form.patchValue({ [keyListener]: eval(resolvedFunct) });
            }
        }
    }

}
