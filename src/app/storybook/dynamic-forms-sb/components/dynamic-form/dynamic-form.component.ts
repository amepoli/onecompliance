import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  ViewChildren,
  QueryList,
  ViewEncapsulation
} from '@angular/core';
import {
  UntypedFormGroup,
  UntypedFormBuilder,
  UntypedFormControl
} from '@angular/forms';
import { FieldConfig } from '../../../../oc/interfaces';
import { DynamicFieldSBDirective } from '../../../directives/dynamic-field-sb.directive';

@Component({
  exportAs: 'dynamicForm',
  selector: 'dynamic-form',
  templateUrl: './dynamic-form.component.html',
  styleUrls: ['./dynamic-form.component.scss']
})
export class DynamicFormComponent implements OnInit, OnChanges {
  @Input() isQuickAdd: boolean = false;

  @Input() fields: FieldConfig[] = [];

  @Input() formName: string;

  @Input() readOnlyPage: boolean;

  @Output() submit: EventEmitter<any> = new EventEmitter<any>();

  @ViewChildren(DynamicFieldSBDirective) dynamicFields: QueryList<DynamicFieldSBDirective>;

  form: UntypedFormGroup;

  get value() {
    return this.form.value;
  }
  constructor(private fb: UntypedFormBuilder) { }

  ngOnInit() {
    console.log('dynamic-form: ', 'Inside dynamic form!');
    //this.form = this.createControl();
  }

  ngOnChanges() {
    this.form = this.createControl();
    console.log('dynamic-form: form: ', this.form);
    console.log('dynamic-form: fields: ', this.fields);
  }

  onSubmit(event: Event) {
    event.preventDefault();
    event.stopPropagation();
  }

  createControl() {
    const group = this.fb.group({});

    this.fields.forEach((field: any) => {
      if (field.type === 'button') return;
      let control : UntypedFormControl | null = null;
      try {
        // Try creating control with validation first
        control = this.fb.control(
          field.value,
        );
      }
      catch (e) {
        // Exception occured, this means validation is invalid, let's try without validation
        control = this.fb.control(
          field.value,
        );
      }
      group.addControl(field.name, control);
    });
    return group;
  }

}
