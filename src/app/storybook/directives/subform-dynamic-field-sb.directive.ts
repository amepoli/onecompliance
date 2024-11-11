import {
  ComponentFactoryResolver,
  ComponentRef,
  Directive,
  Input,
  OnInit,
  ViewContainerRef
} from "@angular/core";
import { UntypedFormGroup } from "@angular/forms";
import { FieldConfig } from '../../oc/interfaces';
import { InputComponent } from "../dynamic-forms-sb/components/input/input.component";
import { ButtonComponent } from "../dynamic-forms-sb/components/button/button.component";
import { SelectComponent } from "../dynamic-forms-sb/components/select/select.component";
import { DateComponent } from "../dynamic-forms-sb/components/date/date.component";
import { RadiobuttonComponent } from "../dynamic-forms-sb/components/radiobutton/radiobutton.component";
import { CheckboxGroupComponent } from "../dynamic-forms-sb/components/checkboxgroup/checkboxgroup.component";
import { CheckboxComponent } from "../dynamic-forms-sb/components/checkbox/checkbox.component";
import { ComboboxComponent } from "../dynamic-forms-sb/components/combobox/combobox.component";
import { TextAreaComponent } from '../dynamic-forms-sb/components/textarea/textarea.component';
import { LabelComponent } from "../dynamic-forms-sb/components/label/label.component";
import { MenuComponent } from "../dynamic-forms-sb/components/menu/menu.component";
import { InvisibleComponent } from "../dynamic-forms-sb/components/invisible/invisible.component";
import { WidgetComponent } from "../dynamic-forms-sb/components/widget/widget.component";

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
  selector: "[subformDynamicFieldSB]"
})
export class SubFormDynamicFieldSBDirective implements OnInit {
  @Input() field: FieldConfig;
  @Input() group: UntypedFormGroup;
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
