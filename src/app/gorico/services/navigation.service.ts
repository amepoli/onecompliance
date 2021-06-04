import { Injectable, EventEmitter } from '@angular/core';
import { HideAction } from '../interfaces';

@Injectable({
    providedIn: 'root'
})
export class NavigationService {

    /**
     * Constructor
     */
    constructor() {
    }

    //#region Toolbar Hide actions

    // Toolbar Hide actions data
    private _toolbarHideActions: string[] = [];

    // get current data
    public getToolbarHideActions() {
        return this._toolbarHideActions;
    }

    // Event Emitter for hide actions
    public onToolbarHideActionsChanged: EventEmitter<string[]> = new EventEmitter();

    // public onHideActionsUpdated: EventEmitter<HideAction[]> = new EventEmitter();

    // Event Emitter for 
    public onBottomTabRefreshRequested: EventEmitter<boolean> = new EventEmitter();


    public onDashboardTableLoad: EventEmitter<{origin: string, dashboardTables: string[]}> = new EventEmitter();

    /**
     * Update Tooblar Hide Actions
     * @param hideActions Hide Actions
     * @param viewType The parent view containing hide actions
     * @emits onToolbarHideActionsChanged Toolbar hide Actions as string[]
     */
    updateToolbarHideActions(hideActions: string[]) {
        this.onToolbarHideActionsChanged.emit(hideActions);
    }

    //#endregion

    /**
     * Get Form Hide Actions
     * @param hideActions Hide Actions list
     * @returns Form Hide Actions
     */
    getFormHideActions(hideActions: HideAction[]) {
        if (!hideActions || !hideActions.length) {
            return [];
        }
        return hideActions
            .filter(a => a.viewType === "form")
            .map(a => a.formActionType);
    }

    /**
     * Get Table Hide Actions
     * @param hideActions Hide Actions list
     * @returns Table Hide Actions
     */
    getTableHideActions(hideActions: HideAction[]) {
        if (!hideActions || !hideActions.length) {
            return [];
        }
        return hideActions
            .filter(a => a.viewType === "table")
            .map(a => a.tableActionType);
    }

    /**
     * Ruest Bottom tabs refresh
     */
    requestBottomTabRefresh() {
        this.onBottomTabRefreshRequested.emit(true);
    }

}

