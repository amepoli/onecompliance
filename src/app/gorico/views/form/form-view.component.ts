import { Component, ViewChild, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { FieldConfig } from 'app/gorico/dynamic-forms/field.interface';
import { DynamicFormComponent } from 'app/gorico/dynamic-forms/components/dynamic-form/dynamic-form.component';
import 'rxjs/add/operator/filter';
import { BackendService } from '../backend/backend.service';
import { MatDialog } from '@angular/material';
import { Validators } from '@angular/forms';
import { TabType } from '../../bottom-tabs/bottom-tabs.component';
import {Location} from '@angular/common';

export interface formViewParams { 
    entryName: string; 
    keys: any;
    index: number; 
    total: number; 
    isNew: boolean; 
    showNavBar: boolean;
}

export type formDataType = 'text' | 'date' | 'number' | 'boolean';

export type formViewType = 'input' | 'textarea' | 'combobox' | 'checkbox' | 'radiobutton';

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

export interface tabViewKey { // as per API specification
    label: string;
    entryKey: string;
    keys: [
        {
            parent: string,
            son: string
        }
    ];
}

type savingStateType = 'save' | 'saving' | 'done';

@Component({
    selector: 'form-view',
    templateUrl: './form-view.component.html',
    styleUrls: ['./form-view.component.scss']
})
export class FormViewComponent implements OnChanges {

    @Input() tableData: formViewParams;
    @Output() sendEvent = new EventEmitter<any>();


    @ViewChild(DynamicFormComponent) form: DynamicFormComponent;

    n = 0;
    tot = 0;

    formData: FieldConfig[] = [];
    isLoading = true;

    viewKeys: formViewKey[]; // view form fields as specified by the backend

    tabKeys: tabViewKey[]; // view tab fields as specified by the backend

    currentKeys: any; // relevant keys passed by the parent component 

    savingState: savingStateType = 'save';

    constructor(public attachDialog: MatDialog, 
        private backendService: BackendService,
        private location: Location) { 
        
        }

    ngOnChanges() {
        let _this = this; // useful to debug
        _this.n = _this.tableData.index;
        _this.tot = _this.tableData.total;

        _this.backendService.getView(_this.tableData.entryName).subscribe(
            params => {
                let tabs: TabType[];
                _this.viewKeys = params.form_keys;
                _this.tabKeys = params.subTables;
                _this.currentKeys = _this.getCurrentKeys(_this.viewKeys, _this.tableData.keys);
                if (!_this.tableData.isNew) {
                    // send the tabs parameter to the main view 
                    tabs = _this.getTabs(_this.tabKeys, _this.tableData.keys);
                    _this.sendEvent.emit({ eventType: 'tabData', queryParams: { tabs: tabs } });
                }
                // load the form
                _this.loadTable();
            });
            
    }

    private loadTable(): void {

        let _this = this; // useful to debug
        _this.backendService.getData(_this.tableData.entryName, _this.currentKeys, null, true, _this.tableData.isNew).subscribe(
            results => {
                _this.isLoading = false;
                console.log(results);
                // add primary keys to current keys if new record
                if (_this.tableData.isNew) {
                    for (const key in results) {
                        if (results.hasOwnProperty(key)) {
                            const element = results[key];
                            let viewKey = _this.viewKeys.find(e => e.key === key);
                            if (viewKey.isPrimary) {
                               _this.currentKeys[key] = element.hasOwnProperty('value') ? element.value : element; // resolve with vlaue if combobox
                            }
                        }
                    }
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
                        value: element.value ? element.value : element,
                        inputType: field.format.dataType ? field.format.dataType : '',
                        readonly: field.readOnly ? field.readOnly : false,
                        isVisible: field.isHidden ? !field.isHidden : true,
                        newLine: field.newLine ? field.newLine : true,
                        options: element.options ? element.options : [],
                        validations: field.format.validations ? field.format.validations : []
                    };
                    fieldValues.push(fieldValue);
                }
                
            }
        }

        return fieldValues;

    }


    getTabs (tabKeys: tabViewKey[], keys: any): TabType[] {
        const tabs: TabType[] = [];
        tabKeys.forEach(tabKey => {
            const tab: TabType = { 
                table: tabKey.entryKey, 
                label: tabKey.label,
                keys: {}
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


    submit(values: any) {
        // process the booleans (1/0 instead of true/false)
        for (const value in values) {
            if (values.hasOwnProperty(value)) {
                const element = values[value];
                if (element === true) {
                    values[value] = '1';
                } 
                if (element === false) {
                    values[value] = '0';
                }
            }
        }

        this.savingState = 'saving';
        this.backendService.updateData(this.tableData.entryName, this.currentKeys, values).subscribe(
            result => {
                console.log(result);
                this.savingState = 'done';
                setTimeout(() => {
                    this.savingState = 'save';
                    this.sendEvent.emit({ eventType: 'savedForm' }); // notify parent
                }, 1000);
            }
        );
    }

    delElement() {
        this.backendService.deleteData(this.tableData.entryName, this.currentKeys).subscribe(
            result => {
                console.log(result);
                // navigate backward
                this.location.back();
            }
        )
    }

    toElement(target: string) {
        this.sendEvent.emit({ eventType: target });
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

}
