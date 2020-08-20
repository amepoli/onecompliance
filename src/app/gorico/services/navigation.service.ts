import { Injectable, EventEmitter } from '@angular/core';

export interface HideAction {
    viewType: "table" | "form";
    tableActionType: "add" | "import_export";
    formActionType: "add" | "delete" | "save" | "share" | "attachments" | "navigate" | "import_export";
}

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
    private _toolbarHideActions: HideAction[] = [];

    // get current data
    public getToolbarHideActions() {
        return this._toolbarHideActions;
    }

    // Event Emitter for hide actions
    public onToolbarHideActionsChanged: EventEmitter<string[]> = new EventEmitter();

    /**
     * Update Tooblar Hide Actions
     * @param hideActions Hide Actions
     * @emits onToolbarHideActionsChanged Toolbar hide Actions as string[] 
     */
    updateToolbarHideActions(hideActions: HideAction[]) {
        // this._toolbarHideActions = hideActions;
        this.onToolbarHideActionsChanged.emit(this.getTableHideActions(hideActions));
    }

    //#endregion

    /**
     * Get Form Hide Actions
     * @param hideActions Hide Actions list
     * @returns Form Hide Actions
     */
    getFormHideActions(hideActions: HideAction[]) {
        if (!hideActions || !hideActions) {
            return [];
        }
        return hideActions.filter(a => a.viewType === "form").map(a => a.formActionType);
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
        return hideActions.filter(a => a.viewType === "table").map(a => a.tableActionType);
    }

}

