import { Component, OnInit, ViewChild } from '@angular/core';
import { Validators } from '@angular/forms';
import { FieldConfig } from 'app/gorico/dynamic-forms/field.interface';
import { TabType } from 'app/gorico/bottom-tabs/bottom-tabs.component';
import { DynamicFormComponent } from 'app/gorico/dynamic-forms/components/dynamic-form/dynamic-form.component';
import { ActivatedRoute, Router } from '@angular/router';
import 'rxjs/add/operator/filter';
import { GenericTableService, operationType } from '../generic-table/generic-table.service';

@Component({
    selector: 'selected-element',
    templateUrl: './selected-element.component.html',
    styleUrls: ['./selected-element.component.scss']
})
export class SelectedElementComponent implements OnInit {

    @ViewChild(DynamicFormComponent) form: DynamicFormComponent;
    n = 0;
    tot = 0;

    regConfig_it: FieldConfig[] = [];
    primaryKeys: any;
    table: string;
    isLoading = true;
    path: string;
    operation: operationType;
    tabs: TabType[];

    constructor(private tableService: GenericTableService,
        private route: ActivatedRoute,
        private router: Router) { }

    ngOnInit() {
        this.n = this.tableService.currentIndex + 1; 
        this.tot = this.tableService.keysArray.length;

        this.route.queryParams
            .subscribe(params => {
                this.primaryKeys = JSON.parse(params.keys);
                this.table = params.table;
                this.path = '/' + this.table; // table names must match with the path
                this.operation = params.operation;
                console.log(params);

                this.tableService.getData(this.path, this.primaryKeys, this.operation).subscribe(
                    results => {
                        this.isLoading = false;
                        // console.log(results);
                        let sameLineElements: FieldConfig[] = [];
                        for (let result of results) {
                            if (result['validations']) {
                                for (let validator of result['validations']) {
                                    if (validator['name'] === 'required') {
                                        validator['validator'] = Validators.required;
                                    }
                                    if (validator['name'] === 'pattern') {
                                        validator['validator'] = Validators.pattern(validator['validator']);
                                    }
                                }
                            }
                            if (result['newLine'] === 'false') {
                                sameLineElements.push(result);
                            } else {
                                result.width = this.processInlineElements(sameLineElements);
                                sameLineElements = [];
                            }
                        }
                        this.processInlineElements(sameLineElements); // handles inline elements of last line
                        sameLineElements = [];
                        console.log(results);
                        this.regConfig_it = results;
                        // now get subtables entries
                        this.tableService.getData(this.path, this.primaryKeys, 'subkeys').subscribe(
                            sublist => {
                                this.tabs = sublist.map(c => {
                                    const tab: TabType = {table: c.table, label: c.label, keys: {}};
                                    c.keys.forEach(key => {
                                        const pos = this.regConfig_it.map(c => c.name).indexOf(key);
                                        tab.keys[key] = this.regConfig_it[pos].value;
                                    });
                                    return tab;
                                });
                                console.log(this.tabs);
                            });
                    },
                    error => {
                        this.isLoading = false;
                    });
            });
    }

    private processInlineElements(elements: FieldConfig[]): Number {
        // this is a small trick to reload indexes if coming from subtable 
        this.n = this.tableService.currentIndex + 1;
        this.tot = this.tableService.keysArray.length;

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

    private processForm(value: any, form: FieldConfig[]) { // prepare fields for postgresql query
        console.log(value);
        let form_keys = form.map(c => c.name);
        // tslint:disable-next-line:forin
        for (const key in value) {
            const item = form[form_keys.indexOf(key)];
            switch (item.type) {
                case 'input': {
                    if (item.inputType === 'text') {
                        if (value[key] !== '' && value[key] !== 'null') {
                            value[key] = '\'' + value[key].replace(/'/g, "''") + '\''; // format the string for postgresql
                        } else {
                            value[key] = 'null';
                        }
                    } else { // number
                        if (value[key] === '') {
                            value[key] = 'null';
                        }
                    }
                    break;
                }
                case 'combobox': {
                    if (value[key] !== '' && value[key] !== 'null') {
                        value[key] = value[key].id;
                        if (item.inputType === 'multiple') {
                            const combo_keys = item.keys.map(c => c.name);
                            const combo_types = item.keys.map(c => c.inputType);
                            const input_values = value[key].split('££');  // array with multiple keys
                            const output_values = {};
                            input_values.forEach(element => {
                                const combo_key = combo_keys.shift();
                                const combo_type = combo_types.shift();
                                if (combo_type === 'text') {
                                    element = '\'' + element + '\'';
                                }
                                output_values[combo_key] = element;
                            });
                            value[key] = output_values;
                        } else if (item.inputType === 'text') {
                            value[key] = '\'' + value[key] + '\'';
                        }
                    } else {
                        if (item.inputType === 'multiple') {
                            const output_values = {};
                            item.keys.forEach(element => {
                                output_values[element.name] = 'null';
                            });
                            value[key] = output_values;
                        } else {
                            value[key] = 'null';
                        }
                    }
                    break;
                }
                case 'checkbox': {
                    value[key] = value[key] ? '1' : '0';
                    break;
                }
                case 'textarea': {
                    if (value[key] !== '' && value[key] !== 'null') {
                        value[key] = '\'' + value[key].replace(/'/g, "''") + '\''; // format the string for postgresql
                    } else {
                        value[key] = 'null';
                    }
                }
            }
        }
        console.log(value);
    }

    submit(value: any) {
        this.processForm(value, this.regConfig_it);
        if (this.operation === 'create') {  // new record
            this.tableService.pushData(this.path, this.primaryKeys, value).subscribe(
                result => {
                    console.log(result);
                }
            );
        } else {  // this.operation = "select", need to update the record
            this.tableService.updateData(this.path, this.primaryKeys, value).subscribe(
                result => {
                    console.log(result);
                }
            );
        }
        this.router.navigate(['/gorico/' + this.table]);
    }

    delElement() {
        this.tableService.deleteData(this.path, this.primaryKeys).subscribe(
            result => {
                console.log(result);
                this.router.navigate(['/gorico/' + this.table]);
            }
        )
    }

    toElement(target: string) {
        const indexArray = this.tableService.keysArray;
        const currentIndex = this.tableService.currentIndex;
        let targetIndex = currentIndex;
        if (target === 'first') {
            targetIndex = 0;
        }
        if (target === 'prev') {
            if (currentIndex > 0) {
                targetIndex = currentIndex - 1;
            }
        }
        if (target === 'next') {
            if (currentIndex < (indexArray.length - 1)) {
                targetIndex = currentIndex + 1;
            }
        }
        if (target === 'last') {
            targetIndex = indexArray.length - 1;
        }

        this.tableService.currentIndex = targetIndex;
        this.n = targetIndex + 1;
        const targetKeys = this.tableService.keysArray[targetIndex];
        const mergedParams = Object.assign({}, { table: this.table, operation: 'select' }, targetKeys);
        this.router.navigate(['/gorico/details'], { queryParams: mergedParams/*, skipLocationChange: true */ });
    }

}
