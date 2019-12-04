import { Component, OnInit, Input, EventEmitter, Output, OnChanges } from '@angular/core';
import { MatTabChangeEvent } from '@angular/material';
import { tableViewParams } from 'app/gorico/views/table/table-view.component';
import { formTableViewParams } from '../views/form-table/form-table-view.component';

export interface TabType {
    label: string;
    table: string;
    type: string;
    keys: {};
}

@Component({
    selector: 'bottom-tabs',
    templateUrl: './bottom-tabs.component.html',
    styleUrls: ['./bottom-tabs.component.scss']
})
export class BottomTabsComponent implements OnChanges {

    @Input() Tabs: TabType[];
    @Output() sendEvent = new EventEmitter<any>();

    tableParams: tableViewParams;

    formTableParams: formTableViewParams;

    activeIndex = 0;

    constructor() { }

    ngOnChanges() {
        if (this.Tabs.length) {
            this.tableParams = { entryName: this.Tabs[this.activeIndex].table, keys: this.Tabs[this.activeIndex].keys, showHeader: false, showFullScreenButton: true };
            this.formTableParams = { entryName: this.Tabs[this.activeIndex].table, keys: this.Tabs[this.activeIndex].keys };
        } 
    }

    tabChanged(tabChangeEvent: MatTabChangeEvent): void {
        this.activeIndex = tabChangeEvent.index;
        this.tableParams = { entryName: this.Tabs[this.activeIndex].table, keys: this.Tabs[this.activeIndex].keys, showHeader: false, showFullScreenButton: true };
        this.formTableParams = { entryName: this.Tabs[this.activeIndex].table, keys: this.Tabs[this.activeIndex].keys };
    }

    onEvent(event: any) {
        
        this.sendEvent.emit(event); // passthrough to the parent component
        
    }

}
