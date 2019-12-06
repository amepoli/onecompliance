import { Component, Input, EventEmitter, Output, OnChanges } from '@angular/core';
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
    @Input() SaveData: boolean;
    @Output() sendEvent = new EventEmitter<any>();

    tableParams: tableViewParams;

    formTableParams: formTableViewParams;

    tableFormSave = false;

    activeIndex = 0;

    constructor() { }

    ngOnChanges(changes) {
        if (changes.Tabs && this.Tabs.length) {
            this.tableParams = { entryName: this.Tabs[this.activeIndex].table, keys: this.Tabs[this.activeIndex].keys, showHeader: false, showFullScreenButton: true };
            this.formTableParams = { entryName: this.Tabs[this.activeIndex].table, keys: this.Tabs[this.activeIndex].keys };
        } else if (changes.SaveData && (this.Tabs[this.activeIndex].type === 'tableForm')) {
            this.tableFormSave = !this.tableFormSave; // propagate to the child by toggling the parameter
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
