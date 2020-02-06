import { Component, Input, EventEmitter, Output, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { MatTabChangeEvent } from '@angular/material';
import { tableViewParams } from 'app/gorico/views/table/table-view.component';
import { formTableViewParams } from '../views/form-table/form-table-view.component';
import { Subscription } from 'rxjs';
import { NgxPubSubService } from "@pscoped/ngx-pub-sub";


export interface TabType {
    label: string;
    table: string;
    type: string;
    hidden: boolean;
    inputEvents: {eventName: string, actionType: string, condition: string, values: string[]}[];
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

    filteredTabs: TabType[] = []; // non hidden tabs

    activeIndex = 0; // current active (filtered) tab index

    subscriptions: Subscription[] = [];

    constructor(private pubsubService: NgxPubSubService) { }

    ngOnChanges(changes) {
        const _this = this;
        if (changes.Tabs && _this.Tabs.length) {
            _this.setFiltered();
            _this.subscriptions.forEach(subscription => {subscription.unsubscribe()}); // clean out subscriptions
            _this.Tabs.forEach(tab => {  // re-suscribe
                if (tab.inputEvents != null && tab.inputEvents.length) {
                    tab.inputEvents.forEach(event => {
                        if (event.actionType === 'show' || event.actionType === 'notShow') {
                            _this.subscriptions.push(_this.pubsubService.subscribe(event.eventName,  msg => {
                                // TODO: handle the other conditions
                                if (event.condition === 'equalTo') {
                                    // normalize if boolean conditions
                                    let eventValues = event.values.map(v => v === 'true' ? '1' : v === 'false' ? '0' : v );
                                    let msgData = Array.isArray(msg.data) ? msg.data : [msg.data];
                                    msgData = msgData.map(m => m === true || m === 1 || m === 'true' ? '1' : m === false || m === 0 || m === 'false' ? '0' : m);
                                    // handle jolly chars 
                                    eventValues = eventValues.map(e => e === '*' ? msgData[eventValues.indexOf(e)] : e);
                                    // tricky way to compare two arrays
                                    const conditionMet = JSON.stringify(eventValues) === JSON.stringify(msgData);
                                    tab.hidden = event.actionType === 'notShow' ? conditionMet : !conditionMet;
                                }
                                _this.setFiltered();  // reset filteredTabs
                            }));
                        }
                    });
                }
            });
            
        } else if (changes.SaveData && (_this.filteredTabs[_this.activeIndex].type === 'tableForm')) {
            _this.tableFormSave = !_this.tableFormSave; // propagate to the child by toggling the parameter
        }
    }

    setFiltered(): void {
        const _this = this;
        _this.filteredTabs = _this.Tabs.filter(tab => !tab.hidden);
        if (_this.filteredTabs.length) { // check if any visible tab
            _this.tableParams = { entryName: _this.filteredTabs[_this.activeIndex].table, keys: _this.filteredTabs[_this.activeIndex].keys, showHeader: false, showFullScreenButton: true };
            _this.formTableParams = { entryName: _this.filteredTabs[_this.activeIndex].table, keys: _this.filteredTabs[_this.activeIndex].keys };
        }
    }

    tabChanged(tabChangeEvent: MatTabChangeEvent): void {
        this.activeIndex = tabChangeEvent.index >= 0 ? tabChangeEvent.index : 0;  // might get a -1
        if (this.filteredTabs.length) {  // at least one tab visible
            this.tableParams = { entryName: this.filteredTabs[this.activeIndex].table, keys: this.Tabs[this.activeIndex].keys, showHeader: false, showFullScreenButton: true };
            this.formTableParams = { entryName: this.Tabs[this.activeIndex].table, keys: this.Tabs[this.activeIndex].keys };
        }
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
