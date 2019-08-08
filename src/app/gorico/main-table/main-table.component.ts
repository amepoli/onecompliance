import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';

import { Router, ActivatedRoute } from '@angular/router';

import { BackendService } from 'app/gorico/views/backend/backend.service'

import { tableViewParams } from 'app/gorico/views/table/table-view.component';
import { formViewParams } from '../views/form/form-view.component';

import { Location } from '@angular/common';

@Component({
    selector: 'main-table',
    templateUrl: './main-table.component.html',
    styleUrls: ['./main-table.component.scss']
})



export class MainTableComponent implements OnInit {

    loadTable = false;

    showQuickAdd = false;

    showAdvSearch = false;

    singleRecord = false;

    private currentTotal = 0;

    protected tableParams: tableViewParams = {
        entryName: '',
        keys: {},
        showHeader: true
    }; 

    protected formParams: formViewParams = {
        entryName: '',
        keys: {},
        index: 0,
        total: this.currentTotal,
        isNew: false
    }

    @ViewChild('List') private List: ElementRef;

    constructor(
        protected route: ActivatedRoute,
        protected router: Router,
        protected backendService: BackendService,
        protected location: Location) {
    }

    ngOnInit(): void {

        this.route.params
            .subscribe(params => {
                console.log(params);
                this.tableParams = { entryName: params.table_name, keys: this.backendService.currentTableKeys, showHeader: true };
            });
        
        this.route.queryParams
            .subscribe(params => {
                if (params.index) { 
                    this.formParams = { entryName: this.tableParams.entryName, keys: this.backendService.currentFormKeys, index: params.index, total: this.currentTotal, isNew: false};
                    console.log(this.formParams);
                    this.singleRecord = true;
                } else {
                    this.singleRecord = false;
                    this.loadTable = true;
                }
            });
    }


    advSearch() {
        this.showAdvSearch = true;

    }

    onEvent(event: any) {

        let paramKeys: any;
        if (event.eventType === 'rowClick') {
            paramKeys = event.queryParams.keys;
            this.currentTotal = event.queryParams.total;
            this.backendService.currentFormKeys = JSON.parse(paramKeys);
            // navigate to the single record component
            this.router.navigate([this.router.url], { queryParams: { index: event.queryParams.index } });
        }
        
    }

    quickAdd(): void {
        this.showQuickAdd = true;

        // TODO

    }

    fullView(): void {
        // toggle full view
    }

    cancel(): void {
        this.showQuickAdd = false;
    }
}




