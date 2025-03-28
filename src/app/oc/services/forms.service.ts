import { Injectable, QueryList, ViewContainerRef } from "@angular/core";

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
import { S3UploadComponent } from "../dynamic-forms/components/s3-upload/s3-upload.component";
import { TextractComponent } from "../dynamic-forms/components/textract/textract.component";
import { FieldConfig, FormGetterParams, FormViewKey, MarkerReplacer, RegulatAPIParams } from "../interfaces";
import { FormDataType } from "../types";
import { ConsoleLoggerService } from "./console_logger.service";
import { FormGetterComponent } from "../views/form-getter/form-getter.component";
import { ToastService } from "./toast.service";
import { DialogService } from "./dialog.service";
import { AuthService } from "./auth.service";
import { BackendService } from "./backend.service";
import { PubSubService } from "./pubsub.service";
import { DynamicFormComponent } from "../dynamic-forms/components/dynamic-form/dynamic-form.component";
import { v4 as uuidv4 } from 'uuid';

@Injectable({
    providedIn: "root",
})
export class FormsService {
    constructor(
        private _console: ConsoleLoggerService,
        private _toastService: ToastService,
        private _dialogService: DialogService,
        private authService: AuthService,
        private backendService: BackendService,
        private _pubSubService: PubSubService,
        private _authService: AuthService,
    ) { }

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
        s3Upload: S3UploadComponent,
        textract: TextractComponent,
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
        startingIndex: number,
        isTabMode: boolean,
        isDialog: boolean,
        formId: string
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
                isTabMode,
                isDialog,
                formId
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
        isTabMode: boolean,
        isDialog: boolean,
        formId: string
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
                        isTabMode,
                        isDialog,
                        formId
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

    public findViewKey(formKeys: FormViewKey[], key: string) {
        var found = formKeys.find((x) => x.key === key);
        if(found) {
            return found;
        }
        else {
            formKeys.filter(x => x.format.subform_keys != null).forEach(subFormKey => {
                const subFormKeyFound = this.findViewKey(subFormKey.format.subform_keys, key);
                if(subFormKeyFound) {
                    found = subFormKeyFound
                }
            });
        }
        return found;
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
        isTabMode: boolean,
        isDialog: boolean,
        formId: string
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
                            isTabMode,
                            isDialog,
                            formId
                        )
                        : null,
                isMultiSelect:
                    field.isMultiSelect != null ? field.isMultiSelect : false,
                showTagsView:
                    field.showTagsView != null ? field.showTagsView : false,
                onChangeResetKey: field.onChangeResetKey ?? [],
                isTabMode,
                isDialog,
                formId
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

    public async runRegulatEvent(event, value, keyListener, formValues: any, keys: any) {
        let _this = this;
        const regulatAPIParams: RegulatAPIParams = event.regulatAPIParams;


        // process the booleans (1/0 instead of true/false)
        for (const value in formValues) {
            if (formValues.hasOwnProperty(value)) {
                const element = formValues[value];
                if (element == null) {
                    continue; // skip null entries
                }
                // decode combos
                if (element["id"] != null) {
                    formValues[value] = element["id"];
                }
                // encode boolean
                else if (element === true) {
                    formValues[value] = "1";
                } else if (element === false) {
                    formValues[value] = "0";
                }
            }
        }

        if (!regulatAPIParams || !regulatAPIParams.actionType) {
            _this._toastService.showErrorToast("Missing Regulat API params");
        } else {
            if (_this.authService.getOneKYCAuth()) {
                if (regulatAPIParams.actionType === "get_aml_scan") {
                    if (!regulatAPIParams.entityParams) {
                        _this._toastService.showErrorToast(
                            "Missing Regulat API entity params",
                        );
                    } else {
                        let loadingToast = _this._toastService.showLoadingToast(
                            "Running OneKYC",
                            "Please wait, it may takes a few minutes",
                        );
                        //_this._dialogService.showLoadingDialog('Running OneKYC', 'Please wait...');
                        //First step, get connected registries
                        let connected_registries = await _this.backendService
                            .getConnectedRegistries(
                                keys.codiceAziendaAML,
                                _this.authService.getLastLanguage(),
                                keys.idAnagraficaAML,
                            )
                            .toPromise();
                        _this._console.log(connected_registries.response);

                        if (connected_registries.response === "KO") {
                            _this._console.log("KO");
                            _this._toastService.hideLoadingToast(loadingToast);
                            //_this._dialogService.closeDialog();
                            _this._toastService.showErrorToastWithReason(connected_registries.reason);
                        } else {
                            let connectedRegistries =
                                connected_registries.response;

                            //Second step, query regulat.io
                            let scan_contents = await _this.backendService
                                .getAmlScan(
                                    keys.codiceAziendaAML,
                                    _this.authService.getLastLanguage(),
                                    connectedRegistries,
                                    keys.idSomministrazioneAML,
                                    keys.dynamoUserAML,
                                    keys.isLightScan,
                                )
                                .toPromise();
                            _this._console.log(scan_contents);

                            _this._toastService.hideLoadingToast(loadingToast);
                            //_this._dialogService.closeDialog();
                            _this._toastService.showSuccessToast(
                                "OneKYC: Completed!",
                            ); // show success toast                            
                        }
                    }
                } else if (regulatAPIParams.actionType === "get_aml_scans") {
                    if (!regulatAPIParams.surveyParams) {
                        _this._toastService.showErrorToast(
                            "Missing Regulat API survey params",
                        );
                    } else {
                        let loadingToast = _this._toastService.showLoadingToast(
                            "Running OneKYC",
                            "Please wait, it may takes a few minutes",
                        );
                        //_this._dialogService.showLoadingDialog('Running OneKYC', 'Please wait...');

                        const codiceAziendaAML =
                            formValues[
                            regulatAPIParams.surveyParams.codice_azienda
                            ];
                        const idSondaggioAML =
                            formValues[
                            regulatAPIParams.surveyParams.id_sondaggio
                            ];
                        const dynamoUserAML =
                            formValues[
                            regulatAPIParams.surveyParams.dynamo_user
                            ];
                        const isLightScan =
                            regulatAPIParams.surveyParams.is_light_scan;

                        //First step, get connected registries
                        let connected_checks = await _this.backendService
                            .getConnectedChecks(
                                codiceAziendaAML,
                                _this.authService.getLastLanguage(),
                                idSondaggioAML,
                            )
                            .toPromise();
                        _this._console.log(connected_checks.response);

                        if (connected_checks.response === "KO") {
                            _this._console.log("KO");
                            _this._toastService.hideLoadingToast(loadingToast);
                            //_this._dialogService.closeDialog();
                            _this._toastService.showErrorToastWithReason(connected_checks.reason);
                        } else {
                            let connectedChecks = connected_checks.response;

                            for (let i = 0; i < connectedChecks.length; i++) {
                                _this._console.log(
                                    connectedChecks[i].id_somministrazione,
                                );

                                //First step, get connected registries
                                let connected_registries =
                                    await _this.backendService
                                        .getConnectedRegistriesFromCheck(
                                            codiceAziendaAML,
                                            _this.authService.getLastLanguage(),
                                            connectedChecks[i]
                                                .id_somministrazione,
                                        )
                                        .toPromise();
                                _this._console.log(
                                    connected_registries.response,
                                );

                                if (connected_registries.response === "KO") {
                                    _this._console.log("KO");
                                    _this._toastService.hideLoadingToast(
                                        loadingToast,
                                    );
                                    //_this._dialogService.closeDialog();
                                    _this._toastService.showErrorToast(
                                        connected_registries.reason,
                                    );
                                    return;
                                } else {
                                    let connectedRegistries =
                                        connected_registries.response;

                                    //Second step, query regulat.io
                                    let scan_contents =
                                        await _this.backendService
                                            .getAmlScan(
                                                codiceAziendaAML,
                                                _this.authService.getLastLanguage(),
                                                connectedRegistries,
                                                connectedChecks[i]
                                                    .id_somministrazione,
                                                dynamoUserAML,
                                                isLightScan,
                                            )
                                            .toPromise();
                                    _this._console.log(scan_contents);
                                }
                            }
                            _this._toastService.hideLoadingToast(loadingToast);
                            //_this._dialogService.closeDialog();
                            _this._toastService.showSuccessToast(
                                "OneKYC: Completed!",
                            ); // show success toast
                        }
                    }
                } else {
                    _this._toastService.showErrorToast(
                        "Missing Regulat Api Params",
                    );
                }
            } else {
                _this._console.error(
                    "You are not subscribed to use OneKYC service",
                );
                _this._dialogService.showErrorDialog(
                    "Missing authorization",
                    "You are not subscribed to use OneKYC service",
                );
            }
        }
    }

    public async runContextMailEvent(formValues: any, keys: any) {
        let _this = this;

        try {
            const responseString = await _this.backendService
                .sendTicketEmail(keys.contesto, keys.chiavi, keys.username)
                .toPromise();

            const response = typeof responseString === "string" ? JSON.parse(responseString) : responseString;
            if (response && response.Success === true) {
                _this._toastService.showSuccessToast("Mail mandata correttamente!");
            } else {
                const errorMessage = response?.Error || "Errore sconosciuto";
                _this._toastService.showErrorToast(
                    `Invio fallito: ${errorMessage}`,
                );
            }
        } catch (error) {
            console.error("Errore durante l'invio dell'email:", error);
            _this._toastService.showErrorToast(
                "Si è verificato un errore imprevisto durante l'invio della mail.",
            );
        }
    }


    processFormValues(formValues: any) {
        for (const key in formValues) {
            if (formValues.hasOwnProperty(key)) {
                const element = formValues[key];
                if (element == null) {
                    continue; // skip null entries
                }
                if (Array.isArray(element)) {
                    if (element.length > 0) {
                        if (element.length === 1 && element[0] === null) {
                            continue; // skip null entries
                            // formValues[key] = 'ARRAY[NULL]';
                        } else if (
                            typeof element[0] === "object" &&
                            Object.keys(element[0]).length > 0 &&
                            element[0]["id"]
                        ) {
                            formValues[key] =
                                "ARRAY[" +
                                element.map((x) => x.id).join(",") +
                                "]";
                        } else {
                            formValues[key] =
                                "ARRAY[" +
                                element.map((x) => x).join(",") +
                                "]";
                        }
                    }
                    else {
                        formValues[key] = "ARRAY[]";
                    }
                }
                // decode combos
                else if(typeof element === 'object') {
                    if (element["id"] != null) {
                        formValues[key] = element["id"];
                    }
                    else if (element["value"] != null) {
                        formValues[key] = element["value"];
                    }
                    else {
                        formValues[key] = null;
                    }
                }
                // encode boolean
                else if (element === true) {
                    formValues[key] = "1";
                } else if (element === false) {
                    formValues[key] = "0";
                }
            }
        }
        return formValues;
    }

    performAutoSave(field: FieldConfig){
        const _this = this;
        if(!field.isTabMode && !field.isDialog) {
            const formAutoSave = _this._authService.userinfo?.value?.formAutoSave ?? false;
            if(formAutoSave){
                _this._pubSubService.publishEvent("perform_form_auto_save", null)
            }
        }
    }

    public static getNewFormId(): string {
        return uuidv4();
    }

    processForm(values: object, viewKeys: FormViewKey[]) {
        const _this = this;

        // process the booleans (1/0 instead of true/false)
        Object.keys(values).forEach(value => {
            if (values.hasOwnProperty(value)) {
                const element = values[value];
                if (element === null) {
                    // continue; // skip null entries
                }
                // To make all checkboxgroup empty arrays as "null"
                // else if(Array.isArray(element) && element.length == 0) {
                //     const targetKey = _this.formGetter.viewKeys.filter(x => x.key === value)[0];
                //     if (targetKey.format.viewType === 'checkboxgroup') {
                //         values[value] = "null";
                //     }
                // }
                else {
                    // make '' -> null
                    if (element === '') {
                        const targetKey = _this.findViewKey(viewKeys, value);
                        if (targetKey && targetKey.format.dataType === 'text' && (targetKey.format.viewType === 'input' || targetKey.format.viewType === 'textarea') && targetKey.format.value !== undefined) {
                            values[value] = targetKey.format.value;
                        }
                    }
                    else if (Array.isArray(element)) {
                        if((element.length === 0 || (element.length === 1 && element[0] === null))) {
                            const targetKey = _this.findViewKey(viewKeys, value);
                            if (targetKey && targetKey.format.value !== undefined) {
                                values[value] = targetKey.format.value;
                            }
                            // To force null in case no default value is provided
                            // else {
                            //     values[value] = null;
                            // }
                        }
                    }
                    // decode combos
                    else if (element['id'] != null) {
                        values[value] = element['id'];
                    }
                    // encode boolean
                    else if (element === true) {
                        values[value] = '1';
                    }
                    else if (element === false) {
                        values[value] = '0';
                    }
                    // To keep the same datetime but add timezone in the end
                    // else if(element.includes('.000' + _this._timezoneService.timezoneInfo.utc_offset)) {
                    // values[value] = element.replace('.000' + _this._timezoneService.timezoneInfo.utc_offset, '.000Z');
                    // }
                }
            }
        });
        return values;
    }
    formsData: any[] = [];

    getFormDataByFormId(formId: string) {
        return this.formsData[formId];
    }

    setFormDataByFormId(formId: string, formData: any) {
        this.formsData[formId] = this.processFormValues(formData);
    }

    setFormDataValueByFormId(formId: string, key: string, value: any) {
        if(this.formsData[formId]) {
            this.formsData[formId][key] = value;
        }
    }

    deleteFormDataByFormId(formId: string) {
        if(this.formsData[formId]) {
            delete this.formsData[formId];
        }
    }    
}
