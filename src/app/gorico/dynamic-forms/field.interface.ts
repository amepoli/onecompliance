export interface Validator {
  name: string;
  validator: any;
  message: string;
}

export interface Item{
    id: string;
    name: string;
} 
export interface FieldConfig {
  label?: string;
  name?: string;
  inputType?: string;
  readonly?: boolean;
  options?: Item[];
  collections?: any;
  type: string;
  value?: any;
  validations?: Validator[];
}
