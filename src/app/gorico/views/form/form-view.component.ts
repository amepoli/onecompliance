import { Component, OnInit, ViewChild, Input, Output, EventEmitter } from '@angular/core';
import { FieldConfig } from 'app/gorico/dynamic-forms/field.interface';
import { DynamicFormComponent } from 'app/gorico/dynamic-forms/components/dynamic-form/dynamic-form.component';
import 'rxjs/add/operator/filter';
import { BackendService } from '../backend/backend.service';
import { MatDialog } from '@angular/material';
import { Validators } from '@angular/forms';

export interface formViewParams { 
    entryName: string, 
    keys: any, 
    index: number, 
    total: number, 
    isNew: boolean 
}

@Component({
    selector: 'form-view',
    templateUrl: './form-view.component.html',
    styleUrls: ['./form-view.component.scss']
})
export class FormViewComponent implements OnInit {

    @Input() tableData: formViewParams;
    @Output() notifyParent = new EventEmitter<any>();


    @ViewChild(DynamicFormComponent) form: DynamicFormComponent;
    n = 0;
    tot = 0;

    formData: FieldConfig[] = [];
    isLoading = true;

    viewSettings: any;

    currentKeys: any; // relevant keys passed by the parent component 

    constructor(public attachDialog: MatDialog, 
        private backendService: BackendService) { 

        }

    ngOnInit() {
        this.n = this.tableData.index;
        this.tot = this.tableData.total;

        this.backendService.getView(this.tableData.entryName).subscribe(
            params => {
                this.viewSettings = params;
                this.currentKeys = this.getCurrentKeys(this.viewSettings.form_keys, this.tableData.keys);
                this.loadTable();
            });
    }

    private loadTable(): void {

        this.backendService.getData(this.tableData.entryName, this.currentKeys, true, this.tableData.isNew).subscribe(
            results => {
                this.isLoading = false;
                console.log(results);
                this.formData = this.getFormData(this.viewSettings.form_keys, results);
                this.process_form(this.formData);
            },
            error => {
                this.isLoading = false;
            });
    }

    private getFormData(formKeys: any[], values: any): FieldConfig[] {
        let fieldValues: FieldConfig[] = [];

        for (const key in values) {
            if (values.hasOwnProperty(key)) {
                const element = values[key];
                const field = formKeys.find(e => (e.key === key));
                let fieldValue: FieldConfig;
                if (field) {
                    fieldValue = {
                        label: field.label,
                        name: field.key,
                        type: field.format.viewType
                    }
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


    submit(value: any) {
        this.backendService.updateData(this.tableData.entryName, this.tableData.keys, value).subscribe(
            result => {
                console.log(result);
                this.notifyParent.emit('');
            }
        );
    }

    delElement() {
        this.backendService.deleteData(this.tableData.entryName, this.tableData.keys).subscribe(
            result => {
                console.log(result);
            }
        )
    }

    getCurrentKeys(validKeysArray: any[], inputKeys:any) {

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
