import { MenuOption } from "./menu_option.interface";
import { EventTriggerType, FormDataType, FormViewType, FormWidgetType } from "../types";
import { FieldInputEvent } from "./field.interface";

export interface FormViewKey { // as per API specification
    isHidden: boolean;
    autoGenerate?: boolean;
    readOnly: boolean;
    isPrimary: boolean;
    isVisible: boolean;
    isLevel?: boolean;
    hasLevel?: boolean;
    newLine: boolean;
    textareaHeight?: 'S' | 'M' | 'L' | 'XL';
    showTextAreaRichFormatter?: boolean;
    buttonIcon?: string;
    confirmButtonAction?: boolean;
    isDownloadButton?: boolean;
    size?: number;
    style?: {
        background_color?: string,
        font_color?: string
    };
    key: string;
    label: string;
    tooltip?: string;
    subKeys?: [
        {
            key: string,
            dataType: FormDataType
        }
    ];
    outputEvent?: {
        eventName: string,
        eventTrigger?: EventTriggerType,
        conditionalQuery?: string
    };
    inputEvents?: FieldInputEvent[];
    format: {
        viewType: FormViewType,
        dataType?: FormDataType,
        widgetType?: FormWidgetType,
        prefix?: string,
        suffix?: string,
        pipe?: "Date" | "DateTime" | "Time" | "UpperCase" | "LowerCase" | "Currency" | "Decimal" | "Percent",
        value?: any,
        options: [
            {
                id: number,
                name: string
            }
        ],
        menuOptions?: MenuOption[],
        comboQuery?: string,
        validations?: [
            {
                message: string,
                name: string,
                validator: string,
                value?: string
            }
        ],
        subform_keys?: FormViewKey[];
    };
}