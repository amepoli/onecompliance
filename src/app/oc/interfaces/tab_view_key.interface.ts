import { TabConditionType, TabEventActionType, TabViewType } from "../types";

export interface TabViewKey { // as per API specification
    label: string;
    entryKey: string;
    translate: string;
    type: TabViewType;
    keys: [
        {
            parent: string,
            son: string
        }
    ];
    inputEvents?: [
        {
            eventName: string,
            actionType: TabEventActionType,
            condition: TabConditionType,
            values: string[]
        }
    ];
    isHidden?: boolean;
    renderingOrder?: number;
}