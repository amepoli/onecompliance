import { Observable } from 'rxjs';

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
  actionType: 'hide' | 'show' | 'readOnly' | 'query' | 'query_style' | 'show_message' | 'toggle' | 'update' | 'update_style';
  eventName: string;
  values: any[];
  condition: 'equalTo' | 'greatorThan' | 'lessThan' | 'none';
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
      actionType: 'reload' | 'query',
      queryFunct?: string
    },
    actionOnNo: {
      actionType: 'reload' | 'query',
      queryFunct?: string
    }
  };
}

export interface FieldConfig {
  label?: string;
  name?: string;
  index?: number;
  inputType?: string;
  readonly?: boolean;
  isVisible?: boolean;
  newLine?: boolean;
  buttonIcon?: string;
  confirmButtonAction?: boolean;
  isDownloadButton?: boolean;
  width?: number;
  style?: { background_color?: string, font_color?: string, font_size?: string, font_style?: 'italic' | 'normal', font_weight?: string };
  options?: Item[];
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

}
