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
    tabFullScreen: boolean;

    constructor(private tableService: GenericTableService,
        private route: ActivatedRoute,
        private router: Router) { }

    ngOnInit() {
        this.n = this.tableService.currentIndex + 1; 
        this.tot = this.tableService.keysArray.length;
        this.tabFullScreen = this.tableService.getFullScreen();

        this.tableService.isFullScreen().subscribe(value => this.tabFullScreen = value);

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
                        this.tableService.process_form(results);
                        // this is a small trick to reload indexes if coming from subtable 
                        this.n = this.tableService.currentIndex + 1;
                        this.tot = this.tableService.keysArray.length;
                        console.log(results);
                        this.regConfig_it = results;
                        // now get subtables entries
                        this.tableService.getData(this.path, this.primaryKeys, 'subkeys').subscribe(
                            sublist => {
                                this.tabs = sublist.map(c => {
                                    const tab: TabType = {table: c.table, label: c.label, keys: {}};
                                    c.keys.forEach(key => {
                                        const pos = this.regConfig_it.map(c => c.name).indexOf(key.parent);
                                        tab.keys[key.parent] = { value: this.regConfig_it[pos].value , son: key.son }; 
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

    submit(value: any) {
        this.tableService.prepare_form(value, this.regConfig_it);
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
        const targetKeys = JSON.stringify(this.tableService.keysArray[targetIndex]);
        const mergedParams = { table: this.table, operation: 'select', keys: targetKeys };
        this.router.navigate(['/gorico/details'], { queryParams: mergedParams/*, skipLocationChange: true */ });
    }

}
