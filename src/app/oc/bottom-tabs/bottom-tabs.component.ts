import { Component, Input, EventEmitter, Output, OnChanges, OnDestroy, OnInit, ViewChild, ChangeDetectorRef, ViewEncapsulation } from '@angular/core';
import { MatTabChangeEvent, MatTabGroup } from '@angular/material/tabs';
import { Subscription } from 'rxjs';
import { FormTableViewParams, TableViewParams, TabType } from '../interfaces';
import { ConsoleLoggerService, PubSubService } from '../services';
@Component({
    selector: 'bottom-tabs',
    templateUrl: './bottom-tabs.component.html',
    styleUrls: ['./bottom-tabs.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class BottomTabsComponent implements OnChanges, OnDestroy {

    @Input() Tabs: TabType[];
    @Input() SaveData: boolean;
    @Output() sendEvent = new EventEmitter<any>();
    @Output() onReload = new EventEmitter<any>();

    @ViewChild("tabsGroup", { static: true }) tabsGroup: MatTabGroup;

    tableParams: TableViewParams;

    formTableParams: FormTableViewParams;

    tableFormSave = false;

    filteredTabs: TabType[] = []; // non hidden tabs

    activeIndex = 0; // current active (filtered) tab index

    subscriptions: Subscription[] = [];

    firstLoad: boolean = true;

    constructor(private cdRef: ChangeDetectorRef, 
                private pubSubService: PubSubService,
                private _console: ConsoleLoggerService) { }

    ngOnChanges(changes) {
        const _this = this;
        if (changes.Tabs && _this.Tabs.length) {
            _this.setFiltered();
            _this.subscriptions.forEach(subscription => { subscription.unsubscribe() }); // clean out subscriptions

            // _this.Tabs.forEach(tab => {  // re-suscribe
            for (let i = 0; i < _this.Tabs.length; i++) {
                let tab = _this.Tabs[i];
                if (tab.inputEvents != null && tab.inputEvents.length) {
                    tab.inputEvents.forEach(event => {
                        if (event.actionType === 'show' || event.actionType === 'hide') {
                            _this.subscriptions.push(_this.pubSubService.subscribe(event.eventName, msg => {
                                setTimeout(() => {
                                // TODO: handle the other conditions
                                if (event.condition === 'equalTo') {
                                    // normalize if boolean conditions
                                    let eventValues = event.values.map(v => v === 'true' ? '1' : v === 'false' ? '0' : v);
                                    let msgData = Array.isArray(msg.data) ? msg.data : [msg.data];
                                    msgData = msgData.map(m => m === true || m === 1 || m === 'true' || m === 't' ? '1' : m === false || m === 0 || m === 'false' || m === 'f' ? '0' : m);
                                    // handle jolly chars 
                                    eventValues = eventValues.map(e => e === '*' ? msgData[eventValues.indexOf(e)] : e);
                                    // tricky way to compare two arrays
                                    const conditionMet = JSON.stringify(eventValues) === JSON.stringify(msgData);
                                    tab.hidden = event.actionType === 'hide' ? conditionMet : !conditionMet;

                                    if (!tab.hidden && _this.firstLoad) {
                                        _this.activeIndex = i;
                                        _this.firstLoad = false;
                                    }
                                }
                                _this.setFiltered(); // reset filteredTabs
                            }, 100);
                            }));
                        }
                    });
                }
                // });
            }

        } else if (changes.SaveData && (_this.filteredTabs[_this.activeIndex] != null && _this.filteredTabs[_this.activeIndex].type === 'tableForm')) {
            _this.tableFormSave = !_this.tableFormSave; // propagate to the child by toggling the parameter
        }
    }

    getFirstVisibleTab() {
        for (let i = 0; i < this.filteredTabs.length; i++) {
            if (!this.filteredTabs[i].hidden) {
                this.activeIndex = i;
                this.firstLoad = true;
                return;
            }
        }
    }

    setFiltered(): void {
        const _this = this;
        const newTabs = JSON.parse(JSON.stringify(_this.Tabs)); //.filter(tab => !tab.hidden);
        
        if (newTabs.length) { // check if any visible tab
            _this.filteredTabs = newTabs.sort((a, b) => a.renderingOrder - b.renderingOrder)
            // Check if active index is greator than maximum tabs
            if (_this.filteredTabs[_this.activeIndex].hidden) {
                _this.getFirstVisibleTab();
            }

            if (_this.activeIndex >= _this.filteredTabs.length) {
                _this.activeIndex = _this.filteredTabs.length - 1;
            }

            _this.tabsGroup.selectedIndex = _this.activeIndex;
            _this.tableParams = { entryName: _this.filteredTabs[_this.activeIndex].table, keys: _this.filteredTabs[_this.activeIndex].keys, showHeader: true, showFullScreenButton: true, searchKeys: null };
            _this.formTableParams = { entryName: _this.filteredTabs[_this.activeIndex].table, keys: _this.filteredTabs[_this.activeIndex].keys, showHeader: true };

            _this.cdRef.detectChanges();
        }
    }

    tabChanged(tabChangeEvent: MatTabChangeEvent): void {
        if (this.filteredTabs && this.filteredTabs.length && tabChangeEvent.index > -1) {  // at least one tab visible
            if(this.tabsGroup.selectedIndex === tabChangeEvent.index) {
                this.activeIndex = tabChangeEvent.index >= 0 ? tabChangeEvent.index : 0;  // might get a -1
                this.tableParams = { entryName: this.filteredTabs[this.activeIndex].table, keys: this.filteredTabs[this.activeIndex].keys, showHeader: true, showFullScreenButton: true, searchKeys: null };
                this.formTableParams = { entryName: this.filteredTabs[this.activeIndex].table, keys: this.filteredTabs[this.activeIndex].keys, showHeader: true };
            }
        }
    }

    onEvent(event: any) {
        this.sendEvent.emit(event); // passthrough to the parent component
    }

    ngOnDestroy() {
        this.subscriptions.forEach(subscription => { subscription.unsubscribe() }); // clean out subscriptions
    }

    get filterVisible() {
        return this.Tabs.filter(t => !t.hidden);
    }

    reload() {
        this._console.log('onReload: bottom-tabs');
        this.clearTabs();
        this.onReload.emit();
    }

    clearTabs() {
        this.Tabs = [];
        this.filteredTabs = [];
        // this.activeIndex = 0;
        this.cdRef.detectChanges();
    }
}
