import { Injectable, ViewContainerRef } from "@angular/core";

import { ValidationsService } from "./validations.service";
import { memoize } from "../decorators/memoize";
import { UntypedFormBuilder } from "@angular/forms";

import { InputComponent } from "../dynamic-forms/components/input/input.component";
import { ButtonComponent } from "../dynamic-forms/components/button/button.component";
import { SelectComponent } from "../dynamic-forms/components/select/select.component";
import { DateComponent } from "../dynamic-forms/components/date/date.component";
import { RadiobuttonComponent } from "../dynamic-forms/components/radiobutton/radiobutton.component";
import { CheckboxGroupComponent } from "../dynamic-forms/components/checkboxgroup/checkboxgroup.component";
import { CheckboxComponent } from "../dynamic-forms/components/checkbox/checkbox.component";
import { ComboboxComponent } from "../dynamic-forms/components/combobox/combobox.component";
import { TextAreaComponent } from "../dynamic-forms/components/textarea/textarea.component";
import { SubformComponent } from "../dynamic-forms/components/subform/subform.component";
import { LabelComponent } from "../dynamic-forms/components/label/label.component";
import { MenuComponent } from "../dynamic-forms/components/menu/menu.component";
import { InvisibleComponent } from "../dynamic-forms/components/invisible/invisible.component";
import { WidgetComponent } from "../dynamic-forms/components/widget/widget.component";
import { FieldConfig, FormGetterParams, FormViewKey, MarkerReplacer } from "../interfaces";
import { FormDataType } from "../types";
import { ConsoleLoggerService } from "./console_logger.service";
import { FormGetterComponent } from "../views/form-getter/form-getter.component";

@Injectable({
    providedIn: "root",
})
export class FormsService {
    constructor(private _console: ConsoleLoggerService) { }

    private componentsMapper = {
        input: InputComponent,
        button: ButtonComponent,
        select: SelectComponent,
        date: DateComponent,
        radiobutton: RadiobuttonComponent,
        checkboxgroup: CheckboxGroupComponent,
        checkbox: CheckboxComponent,
        menu: MenuComponent,
        combobox: ComboboxComponent,
        textarea: TextAreaComponent,
        invisible: InvisibleComponent,
        widget: WidgetComponent,
        label: LabelComponent,
        subform: SubformComponent,
    };

    @memoize()
    public createControl(fb: UntypedFormBuilder, fields: FieldConfig[]) {
        const group = fb.group({});

        fields.forEach((field: FieldConfig) => {
            if (field.type === "button") return;
            let control: any = null;
            try {
                // Try creating control with validation first
                control = fb.control(
                    field.value,
                    ValidationsService.bindValidations(field.validations || []),
                );
            } catch (e) {
                // Exception occured, this means validation is invalid, let's try without validation
                control = fb.control(
                    field.value,
                    ValidationsService.bindValidations([]),
                );
            }
            group.addControl(field.name!, control);
        });
        return group;
    }

    @memoize()
    public createComponent(container: ViewContainerRef, type: string) {
        let componentRef = container.createComponent(
            this.componentsMapper[type],
        );
        return componentRef;
    }

    @memoize()
    public getFormData(
        formKeys: FormViewKey[],
        values: any,
        attributes: any,
        formParams: FormGetterParams,
        currentKeys: any,
        isReadOnly: boolean,
        startingIndex = 0
    ): FieldConfig[][] {
        const fieldValuesArray: FieldConfig[][] = [[]];

        for (let index = 0; index < values.length; index++) {
            fieldValuesArray[index] = this.getFieldValues(
                formKeys,
                attributes,
                formParams,
                isReadOnly,
                currentKeys,
                values,
                index + startingIndex,
            );
        }
        return fieldValuesArray;
    }

    private getFieldValues(
        formKeys: FormViewKey[],
        attributes: any,
        formParams: FormGetterParams,
        isReadOnly: boolean,
        currentKeys: any,
        values: any,
        index: number,
    ): FieldConfig[] {
        const _this = this;
        const fieldValues = new Array();
        for (let i = 0; i < formKeys.length; i++) {
            const field = formKeys[i];
            if (field != null) {
                const element = values[index][field.key];
                // process subkeys of combos/radiobuttons/etc.
                if (field.subKeys != null && field.subKeys.length > 0) {
                    if (element.options != null) {
                        for (let j = 0; j < element.options.length; j++) {
                            const option = element.options[j];
                            if (option.id != null) {
                                option.id = _this.getSubKeysObject(
                                    field.subKeys,
                                    option.id,
                                );
                            }
                        }
                    }
                    if (element.value != null) {
                        element.value = _this.getSubKeysObject(
                            field.subKeys,
                            element.value,
                        );
                    }
                }
                let fieldValue: FieldConfig;
                if (field != null) {
                    fieldValue = _this.getFieldValue(
                        attributes,
                        formParams,
                        currentKeys,
                        isReadOnly,
                        field,
                        element,
                        values,
                        index,
                    );
                    fieldValues.push(fieldValue);
                }
            }
        }
        return fieldValues;
    }

    private getSubKeysObject(
        subKeys: [{ key: string; dataType: FormDataType }],
        commaSeparatedValues: string,
    ): any {
        const outputObject = {};
        if (commaSeparatedValues == null) {
            return null;
        }
        // field is of type '(key1,key2)', get the array
        try {
            const subKeysArray = commaSeparatedValues
                .split("(")[1]
                .split(")")[0]
                .split(",");
            for (let i = 0; i < subKeys.length; i++) {
                const subKey = subKeys[i];
                outputObject[subKey.key] =
                    subKey.dataType === "number"
                        ? parseInt(subKeysArray[i], 10)
                        : subKeysArray[i];
            }
        } catch (e) {
            this._console.log("something wrong with subkeys");
        }
        return outputObject;
    }

    private getFieldValue(
        attributes: any,
        formParams: FormGetterParams,
        currentKeys: any,
        isReadOnly: boolean,
        field: FormViewKey,
        element: any,
        values: any,
        index: number,
    ): FieldConfig {
        const _this = this;
        let fieldValue: FieldConfig;

        const attribute = attributes[field.key];

        let attributeStyle = null;

        if (attribute != null && attribute.style != null) {
            attributeStyle = {};
            for (const style in attribute.style) {
                if (
                    Object.prototype.hasOwnProperty.call(attribute.style, style)
                ) {
                    const el = attribute.style[style];
                    if (el != null && el[index] != null) {
                        attributeStyle[style] = el[index];
                    }
                }
            }
        }

        if (field != null) {
            if (attributeStyle != null) {
                field.style = { ...attributeStyle };
            }

            fieldValue = {
                table: formParams.entryName,
                label: field.label,
                translate: field.translate,
                tooltip: field.tooltip,
                name: field.key,
                type: field.format.viewType,
                widgetType: field.format.widgetType,
                index: index,
                fullValueSet: values[index],
                primaryKeys: currentKeys,
                value:
                    element != null
                        ? element.options != null
                            ? element.value
                            : element
                        : null,
                inputType:
                    field.format.dataType != null
                        ? field.format.dataType
                        : "text",
                prefix: field.format.prefix,
                suffix: field.format.suffix,
                pipe: field.format.pipe,
                readonly:
                    attribute != null &&
                        attribute.readOnly != null &&
                        attribute.readOnly[index] != null
                        ? attribute.readOnly[index]
                        : isReadOnly
                            ? true
                            : field.readOnly != null
                                ? field.readOnly
                                : false,
                isVisible:
                    attribute != null &&
                        attribute.isHidden != null &&
                        attribute.isHidden[index] != null
                        ? !attribute.isHidden[index]
                        : field.isHidden != null
                            ? !field.isHidden
                            : true,
                newLine: field.newLine != null ? field.newLine : true,
                textareaHeight:
                    field.textareaHeight != null ? field.textareaHeight : "S",
                showTextAreaRichFormatter:
                    field.showTextAreaRichFormatter || false,
                buttonIcon: field.buttonIcon != null ? field.buttonIcon : null,
                confirmButtonAction:
                    field.confirmButtonAction != null
                        ? field.confirmButtonAction
                        : false,
                isDownloadButton:
                    field.isDownloadButton != null
                        ? field.isDownloadButton
                        : false,
                style: field.style,
                width: field.size != null ? field.size * 10 : null, // leave a 0.5% margin left and right
                options:
                    element != null && element.options != null
                        ? element.options
                        : [],
                menuOptions:
                    field.format != null && field.format.menuOptions != null
                        ? field.format.menuOptions
                        : [],
                lazyLoading:
                    element != null && element.lazyLoading ? true : false,
                validations:
                    field.format.validations != null
                        ? field.format.validations
                        : [],
                eventName:
                    field.outputEvent != null
                        ? field.outputEvent.eventName
                        : null, // output events are directly handled by the target field component
                eventTrigger:
                    field.outputEvent != null
                        ? field.outputEvent.eventTrigger
                        : null, // at the moment only implemented by input element for focus/blur
                conditionalQuery:
                    field.outputEvent != null &&
                        field.outputEvent.conditionalQuery != null
                        ? field.outputEvent.conditionalQuery
                        : null,
                subform:
                    field.format.viewType === "subform"
                        ? this.getFieldValues(
                            field.format.subform_keys,
                            attributes,
                            formParams,
                            isReadOnly,
                            currentKeys,
                            values,
                            index,
                        )
                        : null,
                isMultiSelect:
                    field.isMultiSelect != null ? field.isMultiSelect : false,
                showTagsView:
                    field.showTagsView != null ? field.showTagsView : false,
                onChangeResetKey: field.onChangeResetKey ?? [],
            };
        }
        /*
        if (fieldValue.newLine) {
            _this._console.log(`Field: ${fieldValue.label} has new line.`);
        }
        */
        //console.table(fieldValue);
        return fieldValue;
    }

    public getCurrentKeys(validKeysArray: FormViewKey[], inputKeys: any) {
        const outputKeys = {};
        for (const key in inputKeys) {
            if (inputKeys.hasOwnProperty(key)) {
                const element = inputKeys[key];
                if (
                    validKeysArray != null &&
                    validKeysArray.find((e) => e.key === key)
                ) {
                    if (
                        element == null ||
                        (element.id == null && element.value == null)
                    ) {
                        outputKeys[key] = element;
                    } else if (element.id != null) {
                        outputKeys[key] = element.id;
                    } else if (element.value != null) {
                        outputKeys[key] = element.value;
                    }
                }
            }
        }

        return outputKeys;
    }

    public isFormValid(formGetter: FormGetterComponent) {
        let isValid = true;
    
        if (formGetter.formArray && formGetter.formArray.length) {
          let formArray = formGetter.formArray.toArray();
          for (let i = 0; i < formArray.length; i++) {
            const form = formArray[i];
            // Old method in which we check the whole form at once
            // This is not good because it also checks invisible fields
            // if (!form.form.valid) {
            //     isValid = false;
            // }
            for (let j = 0; j < form.fields.length; j++) {
              const field = form.fields[j];
              if (field.isVisible) {
                if (form.form.get(field.name) && !form.form.get(field.name).valid) {
                  form.form.get(field.name).markAsTouched({ onlySelf: false });
                  isValid = false;
                }
              }
            }
    
            // if (!isValid) {
            //     // Highlight all empty required fields
            //     Object.keys(form.form.controls).forEach(field => {
            //         const control = form.form.get(field);
            //         control.markAsTouched({ onlySelf: false });
            //     });
            // }
          }
        }
    
        return isValid;
      }
}
