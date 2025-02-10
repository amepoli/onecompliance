import { TableDataType } from "../types";

export interface TableViewKey { // as per API specification
    isHidden: boolean;
    isPrimary: boolean;
    isLevel?: boolean;
    hasLevel?: boolean;
    key: string;
    label: string;
    translate?: string;
    tooltip?: string;
    queryFunct?: string;
    isButton?: boolean;
    isCheckbox?: boolean;
    isSelectCheckbox?: boolean;
    isInputButton?: boolean;
    isInputButtonKey?: string;
    buttonAction?: {
        action: "navigate" | "delete" | "query" | 'downloadAttachment' | 'downloadReport' | 'createFattura' | 'checkFattura',
        target: string,
        viewType: string,
        query?: string,
        reportName?: string,
        reportQueryType?: "form" | "table",
        onSuccessAction?: "reload" | "navigate" | "update_time_tracker" | "update_time_tracker_and_reload",
        confirmAction?: boolean,
        confirmMessage?: {
            title: string,
            text: string
        },
        keymap?: {
            source: string,
            destination: string
        }[],
        onSuccessActionKeymap?: {
            source: string,
            destination: string
        }[],
        navigationConditions?: {
            ifValue: string[],
            newTarget: string,
            newViewType: "form" | "table",
            keyToCheck?: string,
            keymap?: {
                source: string,
                destination: string
            }[]
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
    showTotal?: boolean;
    isTabMode: boolean;
}