import { Component, OnInit, ViewChild, ElementRef, AfterContentInit } from '@angular/core';

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



export class MainTableComponent implements OnInit, AfterContentInit {

    loadTable = false;

    showQuickAdd = false;

    showAdvSearch = false;

    singleRecord = false;

    private currentTotal = 0;

    private currentKeysArray: any[]; // list of primary keys provided by the table-view

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

    ngAfterContentInit() {
        this.backendService.currentTableName = this.tableParams.entryName;
    }


    advSearch() {
        this.showAdvSearch = true;

    }

    onEvent(event: any) {

        let newIndex = 0; // only modified if a navigation event is coming from the form-view
        if (event.eventType === 'rowClick') {
            this.currentKeysArray = JSON.parse(event.queryParams.keysArray);
            this.currentTotal = event.queryParams.total;
            this.backendService.currentFormKeys = this.currentKeysArray[event.queryParams.index - 1];
            // navigate to the single record component
            this.router.navigate([this.router.url], { queryParams: { index: event.queryParams.index } });
        } else if (event.eventType === 'first') {
            newIndex = 1;
        } else if (event.eventType === 'last') {
            newIndex = this.formParams.total;
        } else if (event.eventType === 'prev') {
            if (this.formParams.index > 1) { 
                newIndex =  this.formParams.index - 1;
            }
        } else if (event.eventType === 'next') {
            if (this.formParams.index <  this.formParams.total) {
                newIndex = (Number(this.formParams.index) + 1);
            }
        }

        if (newIndex) {
            this.formParams.index = newIndex;
            this.backendService.currentFormKeys = this.currentKeysArray[newIndex - 1]; 
            // replace the url index query param to reload the page 
            let url: string = this.router.url.substring(0, this.router.url.indexOf("?"));
            this.router.navigate([url], { queryParams: { index: newIndex } });
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




