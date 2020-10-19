import {
  ComponentFactoryResolver,
  ComponentRef,
  Directive,
  Input,
  OnInit,
  ViewContainerRef
} from "@angular/core";
import { FormGroup } from "@angular/forms";
import { FieldConfig } from "../../field.interface";
import { InputComponent } from "../input/input.component";
import { ButtonComponent } from "../button/button.component";
import { SelectComponent } from "../select/select.component";
import { DateComponent } from "../date/date.component";
import { RadiobuttonComponent } from "../radiobutton/radiobutton.component";
import { CheckboxGroupComponent } from "../checkboxgroup/checkboxgroup.component";
import { CheckboxComponent } from "../checkbox/checkbox.component";
import { ComboboxComponent } from "../combobox/combobox.component";
import { TextAreaComponent } from '../textarea/textarea.component';
import { SubformComponent } from '../subform/subform.component';
import { LabelComponent } from "../label/label.component";
import { InvisibleComponent } from "../invisible/invisible.component";

const componentMapper = {
  input: InputComponent,
  button: ButtonComponent,
  select: SelectComponent,
  date: DateComponent,
  radiobutton: RadiobuttonComponent,
  checkboxgroup: CheckboxGroupComponent,
  checkbox: CheckboxComponent,
  combobox: ComboboxComponent,
  textarea: TextAreaComponent,
  invisble: InvisibleComponent,
  label: LabelComponent,
  subform: SubformComponent
};
@Directive({
  selector: "[dynamicField]"
})
export class DynamicFieldDirective implements OnInit {
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
