import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';

import { Router, ActivatedRoute } from '@angular/router';

import { BackendService } from 'app/gorico/views/backend/backend.service'

import { tableViewParams } from 'app/gorico/views/table/table-view.component';

@Component({
    selector: 'main-table',
    templateUrl: './main-table.component.html',
    styleUrls: ['./main-table.component.scss']
})



export class MainTableComponent implements OnInit {

    loadTable = false;

    showQuickAdd = false;

    keysArray: any[];

    showAdvSearch = false;

    protected tableParams: tableViewParams = {
        entryName: '',
        keys: {},
        showHeader: true
    }; 

    @ViewChild('List') private List: ElementRef;

    constructor(
        protected route: ActivatedRoute,
        protected router: Router,
        protected backendService: BackendService) {
    }

    ngOnInit(): void {

        this.route.params
            .subscribe(params => {
                console.log(params);
                this.tableParams.entryName = params.tableName;
                this.tableParams.keys = this.backendService.currentKeys;
                this.tableParams.showHeader = true;
                this.loadTable = true;
            });
    }


    advSearch() {
        this.showAdvSearch = true;

    }

    onEvent(event: any) {

        let paramKeys: any;
        if (event.eventType === 'rowClick') {
            paramKeys = event.keys;
        }
        // navigate to the single record component
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




