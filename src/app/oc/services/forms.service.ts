import { Injectable, ViewContainerRef } from '@angular/core';

import { ValidationsService } from './validations.service';
import { memoize } from '../decorators/memoize';
import { UntypedFormBuilder } from '@angular/forms';

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
import { FieldConfig, MarkerReplacer } from '../interfaces';


@Injectable({
    providedIn: 'root'
})
export class FormsService {

    constructor() { }

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
            if (field.type === 'button') return;
            let control: any = null;
            try {
                // Try creating control with validation first
                control = fb.control(
                    field.value,
                    ValidationsService.bindValidations(field.validations || [])
                );
            }
            catch (e) {
                // Exception occured, this means validation is invalid, let's try without validation
                control = fb.control(
                    field.value,
                    ValidationsService.bindValidations([])
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

}

