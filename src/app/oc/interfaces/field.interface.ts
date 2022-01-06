import { GoogleAPIParams, MenuOption } from ".";
import { FormWidgetType } from "../types";
import { EmailActionParameters } from "./email_action_parameters";

export interface Validator {
  message: string;
  name: string;
  validator: string;
  value?: string;
}

export interface Item {
  id: string;
  name: string;
}

export interface Key {
  name: string;
  inputType: string;
}

export interface FieldInputEvent {
  actionType: 'hide' | 'show' | 'readOnly' | 'query' | 'query_style' | 'show_message' | 'toggle' | 'update' | 'update_style' | 'update_time_tracker' | 'google_api';
  eventName: string;
  values: any[];
  condition: 'equalTo' | 'notEqualTo' | 'greatorThan' | 'lessThan' | 'none';
  queryFunct?: string;
  styleAttribute?: 'background_color' | 'font_color';
  updateFunct?: string;
  actionTarget?: {
    name: string;
    type: 'table' | ' form' | 'tableform';
    keymap?: [
      {
        source: string;
        destination: string
      }
    ]
  };
  message?: {
    messageText: string,
    actionOnYes: {
      actionType: 'reload' | 'query' | 'email',
      queryFunct?: string,
      emailActionParameters?: EmailActionParameters
    },
    actionOnNo: {
      actionType: 'reload' | 'query',
      queryFunct?: string
    }
  };
  googleAPIParams?: GoogleAPIParams
  
}

export interface FieldConfig {
  table?: string;
  label?: string;
  name?: string;
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
  style?: { background_color?: string, font_color?: string, font_size?: string, font_style?: 'italic' | 'normal', font_weight?: string };
  options?: Item[];
  menuOptions?: MenuOption[],
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
  inputEvents?: FieldInputEvent[];
  lazyLoading?: boolean;
  widgetType?: FormWidgetType;
}
