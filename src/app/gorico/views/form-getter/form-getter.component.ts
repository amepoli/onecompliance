import { Component, OnInit, Input, ViewChild, Output, EventEmitter, OnChanges } from '@angular/core';
import { DynamicFormComponent } from 'app/gorico/dynamic-forms/components/dynamic-form/dynamic-form.component';
import { FieldConfig } from 'app/gorico/dynamic-forms/field.interface';
import { BackendService } from '../backend/backend.service';
import { Validators } from '@angular/forms';
import { NgxPubSubService } from '@pscoped/ngx-pub-sub';

export type formDataType = 'text' | 'date' | 'number' | 'boolean';

export type formViewType = 'input' | 'textarea' | 'combobox' | 'checkbox' | 'radiobutton' | 'button';

export interface formViewKey { // as per API specification
    isHidden: boolean;
    autoGenerate?: boolean;
    readOnly: boolean;
    isPrimary: boolean;
    newLine: boolean;
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
        eventTrigger: string
    }
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
export class FormGetterComponent implements OnChanges {

    @Input() formParams: formGetterParams;
    @Output() sendEvent = new EventEmitter<any>();

    @ViewChild(DynamicFormComponent) form: DynamicFormComponent;

    formData: FieldConfig[] = [];
    isLoading = true;

    viewKeys: formViewKey[]; // view form fields as specified by the backend

    currentKeys: any; // relevant keys passed by the parent component 

    constructor(
        private backendService: BackendService,
        private pubsubService: NgxPubSubService) 
        { }

    ngOnChanges() {
        this.refreshView();
    }

    refreshView() {
        let _this = this;
        _this.backendService.getView(_this.formParams.entryName).subscribe(
            params => {
                _this.viewKeys = params.form_keys;
                _this.currentKeys = _this.getCurrentKeys(_this.viewKeys, _this.formParams.keys);
                _this.sendEvent.emit({ eventType: 'formData', viewKeys: _this.currentKeys, tabKeys: params.subTables});
                // handle input events
                if (params.inputEvents != null) {
                    params.inputEvents.eventList.forEach(event => {
                    _this.pubsubService.subscribe(event,
                        value => { 
                            _this.eventCallback(event, value, params.inputEvents.actionType, params.inputEvents.actionValue); 
                        });
                    });
                }
                // load the form 
                _this.loadTableData();
            });

    }

    getCurrentKeys(validKeysArray: formViewKey[], inputKeys:any) {

        let outputKeys = {};
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

        let _this = this; // useful to debug
        _this.backendService.getData(_this.formParams.entryName, _this.currentKeys, null, true, _this.formParams.isNew).subscribe(
            results => {
                _this.isLoading = false;
                console.log(results);
                if (_this.formParams.isNew) {  // handle newly set primary keys
                    let primaryKeys = _this.viewKeys.filter(key => key.isPrimary);
                    _this.currentKeys = _this.getCurrentKeys(primaryKeys, results);
                    _this.sendEvent.emit({ eventType: 'updateKeys', viewKeys: _this.currentKeys });
                } 
                // prepare the form
                _this.formData = _this.getFormData(_this.viewKeys, results);
                _this.process_form(_this.formData);
            },
            error => {
                _this.isLoading = false;
            });
    }

    private getFormData(formKeys: formViewKey[], values: any): FieldConfig[] {

        let fieldValues: FieldConfig[] = [];

        for (const key in values) {
            if (values.hasOwnProperty(key)) {
                // TODO: handle multiple keys fields (combobox only)
                const element = values[key];
                const field = formKeys.find(e => (e.key === key));
                let fieldValue: FieldConfig;
                if (field) {
                    fieldValue = {
                        label: field.label,
                        name: field.key,
                        type: field.format.viewType,
                        value: (element != null) ? ((element.value != null) ? element.value : element) : null,
                        inputType: (field.format.dataType != null) ? field.format.dataType : 'text',
                        readonly: (field.readOnly != null) ? field.readOnly : false,
                        isVisible: (field.isHidden != null) ? !field.isHidden : true,
                        newLine: (field.newLine != null) ? field.newLine : true,
                        options: (element != null && element.options != null) ? element.options : [],
                        validations: (field.format.validations != null) ? field.format.validations : [],
                        eventName: (field.outputEvent != null) ? field.outputEvent.eventName : null
                    };
                    fieldValues.push(fieldValue);
                }
                
            }
        }

        return fieldValues;

    }

    private process_form(input_form: FieldConfig[]): void { // pre-process form got from back-end

        let sameLineElements: FieldConfig[] = [];
        for (let result of input_form) {
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
            if (result['newLine'] === false) {
                sameLineElements.push(result);
            } else {
                result.width = this.processInlineElements(sameLineElements);
                sameLineElements = [];
            }
        }
        this.processInlineElements(sameLineElements); // handles inline elements of last line

    }

    private processInlineElements(elements: FieldConfig[]): number {

        const numElements = 1 + elements.length; // current + previouses
        let sumWidths = 0;
        if (elements.length) { // some elements to put on the same line
            const singleWidth = Math.floor(100 / numElements);
            for (let element of elements) {
                element.width = singleWidth - 10; // considering 10% margins;
                sumWidths += singleWidth;
            }
        }
        return (100 - 10 - sumWidths); // considering 10% margins
    }

    private eventCallback(event: string, value: any, actionType: string, actionValue: string) {
        console.log ('Received event: ' + event + ' with value: ' + value);
        if (actionType === 'show') {
            this.formParams.isVisible = !this.formParams.isVisible;
        }
    }

}
