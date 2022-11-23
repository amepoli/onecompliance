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
  UntypedFormBuilder
} from '@angular/forms';
import { ValidationsService } from 'app/oc/services';
import { FieldConfig } from 'app/oc/interfaces';
import { DynamicFieldDirective } from 'app/oc/directives';

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

  @ViewChildren(DynamicFieldDirective) dynamicFields: QueryList<DynamicFieldDirective>;

  form: UntypedFormGroup;

  get value() {
    return this.form.value;
  }
  constructor(private fb: UntypedFormBuilder) { }

  ngOnInit() {
    //this.form = this.createControl();
  }

  ngOnChanges() {
    this.form = this.createControl();
  }

  onSubmit(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    if (this.form.valid) {
      this.submit.emit(this.form.value);
    } else {
      ValidationsService.validateAllFormFields(this.form);
    }
  }

  createControl() {
    const group = this.fb.group({});

    this.fields.forEach(field => {
      if (field.type === 'button') return;
      let control = null;
      try {
        // Try creating control with validation first
        control = this.fb.control(
          field.value,
          ValidationsService.bindValidations(field.validations || [])
        );
      }
      catch (e) {
        // Exception occured, this means validation is invalid, let's try without validation
        control = this.fb.control(
          field.value,
          ValidationsService.bindValidations([])
        );
      }
      group.addControl(field.name, control);
    });
    return group;
  }

}
