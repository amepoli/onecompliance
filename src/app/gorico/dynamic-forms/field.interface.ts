export interface Validator {
  name: string;
  validator: any;
  message: string;
}

export interface Item{
    id: string;
    name: string;
} 

export interface Key {
    name: string;
    inputType: string;
}
export interface FieldConfig {
  label?: string;
  name?: string;
  inputType?: string;
  readonly?: string;
  isVisible?: string;
  newLine?: string;
  width?: number;
  options?: Item[];
  collections?: any;
  type: string;
  value?: any;
  validations?: Validator[];
  keys?: Key[];
}
