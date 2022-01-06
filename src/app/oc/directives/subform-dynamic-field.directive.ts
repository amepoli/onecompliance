import {
  ComponentFactoryResolver,
  ComponentRef,
  Directive,
  Input,
  OnInit,
  ViewContainerRef
} from "@angular/core";
import { FormGroup } from "@angular/forms";
import { FieldConfig } from 'app/oc/interfaces';
import { InputComponent } from "../dynamic-forms/components/input/input.component";
import { ButtonComponent } from "../dynamic-forms/components/button/button.component";
import { SelectComponent } from "../dynamic-forms/components/select/select.component";
import { DateComponent } from "../dynamic-forms/components/date/date.component";
import { RadiobuttonComponent } from "../dynamic-forms/components/radiobutton/radiobutton.component";
import { CheckboxGroupComponent } from "../dynamic-forms/components/checkboxgroup/checkboxgroup.component";
import { CheckboxComponent } from "../dynamic-forms/components/checkbox/checkbox.component";
import { ComboboxComponent } from "../dynamic-forms/components/combobox/combobox.component";
import { TextAreaComponent } from '../dynamic-forms/components/textarea/textarea.component';
import { LabelComponent } from "../dynamic-forms/components/label/label.component";
import { MenuComponent } from "../dynamic-forms/components/menu/menu.component";
import { InvisibleComponent } from "../dynamic-forms/components/invisible/invisible.component";
import { WidgetComponent } from "../dynamic-forms/components/widget/widget.component";

const componentMapper = {
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
  label: LabelComponent
};
@Directive({
  selector: "[subformDynamicField]"
})
export class SubFormDynamicFieldDirective implements OnInit {
  @Input() field: FieldConfig;
  @Input() group: FormGroup;
  @Input() readOnlyPage: boolean;
  componentRef: any;
  constructor(
    private resolver: ComponentFactoryResolver,
    private container: ViewContainerRef
  ) { }
  ngOnInit() {
    const factory = this.resolver.resolveComponentFactory(
      componentMapper[this.field.type]
    );
    this.componentRef = this.container.createComponent(factory);
    this.componentRef.instance.field = this.field;
    this.componentRef.instance.group = this.group;
    this.componentRef.instance.readOnlyPage = this.readOnlyPage;
  }
}
