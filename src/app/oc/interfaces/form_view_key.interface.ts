import { MenuOption } from "./menu_option.interface";
import { EventTriggerType, FormDataType, FormViewType, FormWidgetType } from "../types";
import { FieldInputEvent, Item } from "./field.interface";
import { AttributePostChecks } from "./attribute_post_checks.interface";

export interface FormViewKey { // as per API specification
    isHidden: boolean;
    autoGenerate?: boolean;
    readOnly: boolean;
    isPrimary: boolean;
    isVisible: boolean;
    isLevel?: boolean;
    hasLevel?: boolean;
    newLine: boolean;
    isMultiSelect?: boolean;
    showTagsView?: boolean;
    onChangeResetKey?: string[];
    textareaHeight?: 'S' | 'M' | 'L' | 'XL';
    showTextAreaRichFormatter?: boolean;
    buttonIcon?: string;
    confirmButtonAction?: boolean;
    isDownloadButton?: boolean;
    size?: number;
    style?: {
        background_color?: string;
        font_color?: string;
        font_size?: string;
        font_style?: "italic" | "normal";
        font_weight?: string;
    };
    key: string;
    label: string;
    translate?: string;    
    tooltip?: string;
    sameOrigin?: boolean;
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
        options?: Item[],
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
    attributePostChecks?: AttributePostChecks[];
}