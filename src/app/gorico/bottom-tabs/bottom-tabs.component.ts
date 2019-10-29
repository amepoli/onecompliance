import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { MatTabChangeEvent } from '@angular/material';
import { tableViewParams } from 'app/gorico/views/table/table-view.component';

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
export class BottomTabsComponent implements OnInit {

    @Input() Tabs: TabType[];
    @Output() sendEvent = new EventEmitter<any>();

    tableParams: tableViewParams;

    activeIndex = 0;

    constructor() { }

    ngOnInit() {
        if (this.Tabs.length) {
            this.tableParams = { entryName: this.Tabs[this.activeIndex].table, keys: this.Tabs[this.activeIndex].keys, showHeader: false, showFullScreenButton: true };
        } 
    }

    tabChanged(tabChangeEvent: MatTabChangeEvent): void {
        this.activeIndex = tabChangeEvent.index;
        this.tableParams = { entryName: this.Tabs[this.activeIndex].table, keys: this.Tabs[this.activeIndex].keys, showHeader: false, showFullScreenButton: true };
    }

    onEvent(event: any) {
        
        this.sendEvent.emit(event); // passthrough to the parent component
        
    }

}
