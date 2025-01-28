export interface TabType {
    label: string;
    table: string;
    translate: string;
    type: string;
    hidden: boolean;
    showByFormKeyCondition?: {
        key: string,
        condition: "equalTo" | "notEqualTo" | "greaterThan" | "lessThan",
        values?: string[]
    };
    inputEvents: { eventName: string, actionType: string, condition: string, values: string[] }[];
    keys: {};
    renderingOrder: number;
    topViewFullValueSet: object;
}