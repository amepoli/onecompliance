export interface SearchSwitch {
    fieldName: string;
    label: string;
    condition: "equal" | "notEqual" | "include";
    value: any;
    checked?: boolean;
}