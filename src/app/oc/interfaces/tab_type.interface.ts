export interface TabType {
    label: string;
    table: string;
    translate: string;
    type: string;
    hidden: boolean;
    inputEvents: { eventName: string, actionType: string, condition: string, values: string[] }[];
    keys: {};
}