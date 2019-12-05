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

    fullScreenTab = false;

    tabs: TabType[] = [];

    public navigationHistory: {level: number, tableName: string, type: string, tableKeys: any, primaryKeys: any, params: any, description: string}[] = [];

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

    private level = 0;  // current depth of navigation

    private tableName: string;

    public tableType: string;

    public currentDescription: string;

    private currentTableKeys = {};  // keys set in currently active table/subtable (might be foreing keys of subtable)

    private currentPrimaryKeys: any[]; // current list of primary keys provided by the table-view

    @ViewChild('List') private List: ElementRef;

    constructor(
        protected route: ActivatedRoute,
        protected router: Router,
        protected backendService: BackendService,
        protected location: Location) {
    }

    ngOnInit(): void {

        const _this = this;

        _this.route.params
            .subscribe(params => {
                _this.navigationHistory.length = 0;       // flush navigation history
                _this.level = 0; 
                _this.tableName = params.table_name;
                _this.currentDescription = 'Tabella ' + _this.tableName;
                _this.tableType = 'table';           // only table views from left navigation bar 
                _this.currentTableKeys = _this.backendService.globalTableKeys;
                _this.tableParams = { entryName: _this.tableName, keys: _this.currentTableKeys, showHeader: true, showFullScreenButton: false };
            });
    }

    ngAfterContentInit() {
        // this.backendService.currentTableName = this.tableParams.entryName;
    }

    onEvent(event: any) {

        const _this = this;

        let newIndex = 0; // only modified if a navigation event is coming from the form-view
        let newTotal = _this.formParams.total; 
        if (event.eventType === 'navigate') {
            _this.fullScreenTab = false; // reset in case of fullScreen Tab view
            const currentNavigation = {
                level: _this.level, 
                tableName: _this.tableName, 
                type: _this.tableType, 
                tableKeys: _this.currentTableKeys, 
                primaryKeys: _this.currentPrimaryKeys,
                params: _this.tableType === 'table' ? _this.tableParams : _this.formParams,
                description: _this.currentDescription};
            _this.navigationHistory.push(currentNavigation);
            _this.level = _this.level + 1; // going in depth
            _this.currentPrimaryKeys = event.queryParams.keys; // update
            _this.tableName = event.queryParams.entry.name;
            if (event.queryParams.entry.type === 'table') {
                _this.tableParams = { entryName: _this.tableName, keys: _this.currentTableKeys, showHeader: true, showFullScreenButton: false };
                _this.tableType = 'table';
                _this.currentDescription = 'Tabella ' + _this.tableName;
            } else if (event.queryParams.entry.type === 'form') { // handled later on
                newIndex = event.queryParams.index;
                newTotal = event.queryParams.total;
                _this.currentDescription = 'Dettaglio ' + _this.tableName;
            }

        } else if (event.eventType === 'first') {
            newIndex = 1;
        } else if (event.eventType === 'last') {
            newIndex = _this.formParams.total;
        } else if (event.eventType === 'prev') {
            if (_this.formParams.index > 1) { 
                newIndex =  _this.formParams.index - 1;
            }
        } else if (event.eventType === 'next') {
            if (_this.formParams.index <  _this.formParams.total) {
                newIndex = (Number(_this.formParams.index) + 1);
            }
        } else if (event.eventType === 'tabData'){
            if (event.queryParams.tabs != null) {
                // fill the bottom tabs
                this.tabs = event.queryParams.tabs;
                this.showTabs = true;
            } else {
                this.showTabs = false;
            }
        } else if (event.eventType === 'fullScreen') {
            this.fullScreenTab = event.queryParams.value;
        } else if (event.eventType === 'currentTableKeys') {  // table in subtable view providing its current keys
            this.currentTableKeys = event.queryParams.keys;
        } else {
            return; // not handled
        }

        if (newIndex) { // 
            _this.formParams = { 
                entryName: _this.tableName, 
                index: newIndex, 
                keys: _this.currentPrimaryKeys[newIndex - 1], 
                total: newTotal, 
                isNew: false, 
                showNavBar: _this.formParams.showNavBar};
            _this.tableType = 'form';  // push the visualization only at this point, needed if moving from table to form view
        }

       
    }

    fullView(): void {
        // toggle full view
    }

    historyPop(item: any) {
        const _this = this;
        _this.fullScreenTab = false; // reset in case of fullScreen Tab view
        _this.navigationHistory.length = item.level; // remove itself and following history elements 
        _this.level = item.level;
        _this.currentTableKeys = item.tableKeys;
        _this.tableName = item.tableName;
        _this.currentPrimaryKeys = item.primaryKeys;
        if (item.type === 'table') {
            _this.tableParams = item.params;
            _this.currentDescription = 'Tabella ' + _this.tableName;
            _this.tableType = 'table';  
        } else {
            _this.formParams = item.params;
            _this.currentDescription = 'Dettaglio ' + _this.tableName;
            _this.tableType = 'form';
        }
    }

}




