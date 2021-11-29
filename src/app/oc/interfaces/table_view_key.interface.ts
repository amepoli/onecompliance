import { TableDataType } from "../types";

export interface TableViewKey { // as per API specification
    isHidden: boolean;
    isPrimary: boolean;
    isLevel?: boolean;
    hasLevel?: boolean;
    key: string;
    label: string;
    queryFunct?: string;
    isButton?: boolean;
    isCheckbox?: boolean;
    isSelectCheckbox?: boolean;
    buttonAction?: {
        action: "navigate" | "delete" | "query" | 'downloadAttachment',
        target: string,
        viewType: string,
        query?: string,
        onSuccessAction?: "reload" | "navigate" | "update_time_tracker" | "update_time_tracker_and_reload",
        confirmAction?: boolean,
        confirmMessage?: {
            title: string,
            text: string
        },
        keymap?:{
            source: string,
            destination: string
        }[],
        onSuccessActionKeymap?:{
            source: string,
            destination: string
        }[]
    },
    format: {
        dataType: TableDataType,
        value?: any,
        prefix?: string,
        suffix?: string,
        pipe?: "Date" | "DateTime" | "Time" | "UpperCase" | "LowerCase" | "Currency" | "Decimal" | "Percent"
    };
    width?: string;
}