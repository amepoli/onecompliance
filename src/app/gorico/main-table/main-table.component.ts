import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { MatTableDataSource, MatPaginator, MatSort, MatRow } from '@angular/material';

import { Router, ActivatedRoute } from '@angular/router';

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

    // to override in derived classes
    protected tableParams = { 
        entryName: '', 
        showHeader: true
    };

    @ViewChild('List') private List: ElementRef;

    constructor(
        protected route: ActivatedRoute,
        protected router: Router) {
    }

    ngOnInit(): void {

        this.route.params
            .subscribe(params => {
                console.log(params);
                this.tableParams.entryName = params.tableName;
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




