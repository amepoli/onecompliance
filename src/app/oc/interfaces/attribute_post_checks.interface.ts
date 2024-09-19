export interface AttributePostChecks {
    attributeType: "isHidden" | "readOnly" | "style";
    resultType?: "condition" | "value";
    conditionType?: "equalTo" | "notEqualTo" | "greaterThan" | "lessThan" | "Includes";
    conditionValue?: any;
    resultTrueValue?: any;
    resultFalseValue?: any;
    key?: string;
    styleAttribute?: "background_color" | "font_color" | "font_size" | "font_style" | "font_weight";
}