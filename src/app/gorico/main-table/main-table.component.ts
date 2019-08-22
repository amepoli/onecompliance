import { Component, OnInit, ViewChild, ElementRef, AfterContentInit } from '@angular/core';

import { Router, ActivatedRoute } from '@angular/router';

import { BackendService } from 'app/gorico/views/backend/backend.service'

import { tableViewParams } from 'app/gorico/views/table/table-view.component';
import { formViewParams } from '../views/form/form-view.component';
import { TabType } from '../bottom-tabs/bottom-tabs.component';

import { Location } from '@angular/common';

@Component({
    selector: 'main-table',
    templateUrl: './main-table.component.html',
    styleUrls: ['./main-table.component.scss']
})



export class MainTableComponent implements OnInit, AfterContentInit {

    loadTable = false;

    showTabs = false;

    singleRecord = false;

    fullScreenTab = false;

    tabs: TabType[] = [];

    private level = 0; // used to trigger reload when navigating in sub-tables 

    private levelArray: number[] = []; // used to keep history of levels

    private tableParams: tableViewParams = {
        entryName: '',
        keys: {},
        showHeader: true,
        showFullScreenButton: false
    }; 

    private formParams: formViewParams = {
        entryName: '',
        keys: {},
        index: 0,
        total: 0,
        isNew: false,
        showNavBar: true
    };


    private currentKeys: any[]; // current list of primary keys provided by the table-view

    private currentKeysArray: any[][] = []; // history of primary keys 

    private programmaticNavigation = true; // true if navigating through buttons (vs. browser history)

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
                this.tableParams = { entryName: params.table_name, keys: this.backendService.globalTableKeys, showHeader: true, showFullScreenButton: false };
            });
        
        this.route.queryParams
            .subscribe(params => {
                this.fullScreenTab = false; // reset in case of fullScrren Tab view
                if (params.index) { 
                    if (this.programmaticNavigation) {
                        this.programmaticNavigation = false;
                    } else {
                        this.currentKeys = this.currentKeysArray.pop(); // get from history
                        this.level = this.levelArray.pop();
                    }
                    this.formParams = { entryName: this.tableParams.entryName, keys: this.currentKeys[params.index - 1], 
                        index: params.index, total: this.currentKeys.length, isNew: false, showNavBar: true};
                    console.log(this.currentKeysArray);
                    this.singleRecord = true;
                    this.showTabs = false;
                } else if (params.new) {
                    this.formParams = { entryName: this.tableParams.entryName, keys: this.backendService.globalTableKeys, 
                        index: 1, total: 1, isNew: true, showNavBar: true};
                        this.singleRecord = true;
                        this.showTabs = false;
                } else {
                    this.singleRecord = false;
                    this.loadTable = true;
                    this.currentKeysArray = []; // flush history when in table view
                    this.level = 0;
                }
            });
    }

    ngAfterContentInit() {
        this.backendService.currentTableName = this.tableParams.entryName;
    }

    onEvent(event: any) {

        let newIndex = 0; // only modified if a navigation event is coming from the form-view
        if (event.eventType === 'rowClick') {
            this.levelArray.push(this.level); // add to history
            this.level = this.level + 1; // update
            this.currentKeysArray.push(this.currentKeys); // add to history
            this.currentKeys = JSON.parse(event.queryParams.keysArray); // update
            this.programmaticNavigation = true;
            // navigate to the single record component
            let url: string = this.router.url.substring(0, this.router.url.indexOf('/gorico')) 
                + 'gorico/main-table/' + event.queryParams.entry;
            this.router.navigate([url], { queryParams: { index: event.queryParams.index, level: this.level } });
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
        } else if (event.eventType === 'tabData'){
            // fill the bottom tabs
            this.tabs = event.queryParams.tabs;
            this.showTabs = true;
        } else if (event.eventType === 'fullScreen') {
            this.fullScreenTab = event.queryParams.value;
        } else {
            return; // not handled
        }

        if (newIndex) {
            this.formParams.index = newIndex; 
            this.currentKeysArray.push(this.currentKeys); // add to history
            this.levelArray.push(this.level); // add to history
            this.programmaticNavigation = true;
            // replace the url index query param to reload the page 
            let url: string = this.router.url.substring(0, this.router.url.indexOf('?'));
            this.router.navigate([url], { queryParams: { index: newIndex, level: this.level} });
        }
       
    }

    fullView(): void {
        // toggle full view
    }

}




