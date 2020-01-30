import { Component, Input, EventEmitter, Output, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { MatTabChangeEvent } from '@angular/material';
import { tableViewParams } from 'app/gorico/views/table/table-view.component';
import { formTableViewParams } from '../views/form-table/form-table-view.component';
import { Subscription } from 'rxjs';
import { NgxPubSubService } from "@pscoped/ngx-pub-sub";
import { TabNavBarBasicExample } from 'assets/angular-material-examples/tab-nav-bar-basic/tab-nav-bar-basic-example';

export interface TabType {
    label: string;
    table: string;
    type: string;
    hidden: boolean;
    inputEvents: {eventName: string, actionType: string }[];
    keys: {};
}

@Component({
    selector: 'bottom-tabs',
    templateUrl: './bottom-tabs.component.html',
    styleUrls: ['./bottom-tabs.component.scss']
})
export class BottomTabsComponent implements OnChanges, OnDestroy {

    @Input() Tabs: TabType[];
    @Input() SaveData: boolean;
    @Output() sendEvent = new EventEmitter<any>();

    tableParams: tableViewParams;

    formTableParams: formTableViewParams;

    tableFormSave = false;

    filteredTabs: TabType[]; // non hidden tabs

    activeIndex = 0; // current active (filtered) tab index

    subscriptions: Subscription[] = [];

    constructor(private pubsubService: NgxPubSubService) { }

    ngOnChanges(changes) {
        const _this = this;
        if (changes.Tabs && _this.Tabs.length) {
            _this.filteredTabs = _this.Tabs.filter(tab => !tab.hidden);
            _this.subscriptions.forEach(subscription => {subscription.unsubscribe()}); // clean out subscriptions
            _this.Tabs.forEach(tab => {  // re-suscribe
                if (tab.inputEvents != null && tab.inputEvents.length) {
                    tab.inputEvents.forEach(event => {
                        if (event.actionType === 'show' || event.actionType === 'notShow') {
                            _this.subscriptions.push(_this.pubsubService.subscribe(event.eventName,  msg => {
                                tab.hidden = event.actionType === 'notShow' ? msg.data : !msg.data;
                                _this.filteredTabs = _this.Tabs.filter(t => !t.hidden);  // reset filteredTabs
                            }));
                        }
                    });
                }
            });
            _this.tableParams = { entryName: _this.filteredTabs[_this.activeIndex].table, keys: _this.filteredTabs[_this.activeIndex].keys, showHeader: false, showFullScreenButton: true };
            _this.formTableParams = { entryName: _this.filteredTabs[_this.activeIndex].table, keys: _this.filteredTabs[_this.activeIndex].keys };
        } else if (changes.SaveData && (_this.filteredTabs[_this.activeIndex].type === 'tableForm')) {
            _this.tableFormSave = !_this.tableFormSave; // propagate to the child by toggling the parameter
        }
    }

    tabChanged(tabChangeEvent: MatTabChangeEvent): void {
        this.activeIndex = tabChangeEvent.index;
        this.tableParams = { entryName: this.filteredTabs[this.activeIndex].table, keys: this.Tabs[this.activeIndex].keys, showHeader: false, showFullScreenButton: true };
        this.formTableParams = { entryName: this.Tabs[this.activeIndex].table, keys: this.Tabs[this.activeIndex].keys };
    }

    onEvent(event: any) {
        
        this.sendEvent.emit(event); // passthrough to the parent component
        
    }
    ngOnDestroy() {
        this.subscriptions.forEach(subscription => {subscription.unsubscribe()}); // clean out subscriptions
    }

    get filterVisible() {
        return this.Tabs.filter( t => !t.hidden);
    }

}
