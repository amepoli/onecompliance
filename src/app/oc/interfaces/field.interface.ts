import { GoogleAPIParams, RegulatAPIParams, MenuOption } from ".";
import { FormWidgetType } from "../types";
import { EmailActionParameters } from "./email_action_parameters";
import { ContextMailParams } from "./context_mail_params.interface";
export interface Validator {
    message: string;
    name: string;
    validator: string;
    value?: string;
    translate?: string;
}

export interface Item {
    id: any;
    name: string;
}

export interface Key {
    name: string;
    inputType: string;
}

export interface FieldInputEvent {
    actionType: "hide" | "show" | "readOnly" | "query" | "query_style" | "show_message" | "toggle" | "update" | "update_style" | "update_time_tracker" | "google_api" | "regulat_api" | "user_api" | "dialog" | "send_email";
    eventName: string;
    values: any[];
    customValues?: any[];
    condition: "equalTo" | "notEqualTo" | "greatorThan" | "lessThan" | "none";
    queryFunct?: string;
    styleAttribute?: "background_color" | "font_color";
    updateFunct?: string;
    actionTarget?: {
        name: string;
        type: "table" | " form" | "tableform";
        keymap?: [
            {
                source: string;
                destination: string;
            },
        ];
    };
    outputEventWhenComplete?: string;
    successMessage?: string;
    message?: {
        messageTitle?: string;
        messageText: string;
        actionOnYes: {
            actionType: "reload" | "query" | "email" | "create_user_and_email" | "enable_company_to_user" | "dissociates_company" | "multi_enablement_company_to_users" | "regulat_api" | "context_mail";
            queryFunct?: string;
            emailActionParameters?: EmailActionParameters;
            regulatAPIParams?: any;
            contextMailParams?: ContextMailParams;
        };
        actionOnNo: {
            actionType: "reload" | "query" | "skip";
            queryFunct?: string;
        };
    };
    googleAPIParams?: GoogleAPIParams /* ;
  RegulatAPIParams?: RegulatAPIParams */;

    customDialogGenericSave?: boolean;
    customDialogEntryName?: string;
    customDialogTitle?: string;
}

export interface FieldConfig {
    table?: string;
    label?: string;
    translate?: string;
    name?: string;
    tooltip?: string;
    index?: number;
    inputType?: string;
    readonly?: boolean;
    isVisible?: boolean;
    newLine?: boolean;
    textareaHeight?: "S" | "M" | "L" | "XL";
    showTextAreaRichFormatter?: boolean;
    buttonIcon?: string;
    prefix?: string;
    suffix?: string;
    pipe?: "Date" | "DateTime" | "Time" | "UpperCase" | "LowerCase" | "Currency" | "Decimal" | "Percent";
    confirmButtonAction?: boolean;
    isDownloadButton?: boolean;
    width?: number;
    style?: {
        background_color?: string;
        font_color?: string;
        font_size?: string;
        font_style?: "italic" | "normal";
        font_weight?: string;
    };
    checkboxGroupItemsStyle?: {
        id: any;
        background_color?: string;
        font_color?: string;
        font_size?: string;
        font_style?: "italic" | "normal";
        font_weight?: string;
    }[];
    options?: Item[];
    isMultiSelect?: boolean;
    showTagsView?: boolean;
    onChangeResetKey?: string[];
    menuOptions?: MenuOption[];
    collections?: any;
    type: string;
    value?: any;
    validations?: Validator[];
    keys?: Key[];
    eventName?: string;
    eventTrigger?: string;
    conditionalQuery?: string;
    subform?: FieldConfig[];
    fullValueSet?: any;
    primaryKeys?: any;
    inputEvents?: FieldInputEvent[];
    lazyLoading?: boolean;
    widgetType?: FormWidgetType;
    onClick?: Function;
    onBlur?: Function;
    isTabMode: boolean;
    isDialog: boolean;
    
}