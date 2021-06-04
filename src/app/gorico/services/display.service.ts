import { EventEmitter, Injectable } from '@angular/core';
import { DisplayServiceConstants, DisplayServiceSettings } from '../interfaces';

@Injectable({
    providedIn: 'root'
})
export class DisplayService {

    public constants: DisplayServiceConstants = {
        navbarHeight: 64,
        mainTableHeaderHeight: 110,
        formViewMiniHeight: 480,
        bottomTabsHeaderHeight: 50
    };

    public settings: DisplayServiceSettings  = {
        mainTableViewContentHeight: 0,
        bottomViewHeight: 0
    };

    public windowHeight: number = 0;

    /**
     * DisplayServiceSettingsEventEmitter
     */
    public onDisplayServiceSettingsChanged = new EventEmitter<DisplayServiceSettings>();

    /**
     * Constructor
     *
     */
    constructor() {
        this.windowHeight = window.innerHeight;
        this.createSingleView('table');
    }

    public createSingleView(tableType) {
        if(tableType === 'table') {
            this.settings = {
                mainTableViewContentHeight: this.windowHeight - this.constants.navbarHeight,
                bottomViewHeight: 0
            }
        }
        else {
            this.settings = {
                mainTableViewContentHeight: this.windowHeight - this.constants.navbarHeight - 110,
                bottomViewHeight: 0
            }
        }
        this.onDisplayServiceSettingsChanged.emit(this.settings);
    }

    public createMultiView() {
        this.settings = {
            mainTableViewContentHeight: this.constants.formViewMiniHeight - 10,
            bottomViewHeight: this.windowHeight - this.constants.navbarHeight - this.constants.mainTableHeaderHeight - this.constants.bottomTabsHeaderHeight - this.constants.formViewMiniHeight - 24
        }
        this.onDisplayServiceSettingsChanged.emit(this.settings);
    }

    public createFullscreenMultiView() {
        this.settings = {
            mainTableViewContentHeight: 0,
            bottomViewHeight: this.windowHeight - this.constants.mainTableHeaderHeight - this.constants.bottomTabsHeaderHeight - 10
        }
        this.onDisplayServiceSettingsChanged.emit(this.settings);
    }

}

