import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  ViewChildren,
  QueryList
} from '@angular/core';
import {
  FormGroup,
  FormBuilder,
  Validators
} from '@angular/forms';
import { FieldConfig, Validator } from '../../field.interface';
import { DynamicFieldDirective } from '../dynamic-field/dynamic-field.directive';

@Component({
  exportAs: 'dynamicForm',
  selector: 'dynamic-form',
  template: `
  <form class='dynamic-form' [id]='formName' [formGroup]='form' (submit)='onSubmit($event)'>
  <ng-container *ngFor='let field of fields;' dynamicField [field]='field' [group]='form' [readOnly]='readOnly'>
  </ng-container>
  </form>
  `,
  styles: []
})
export class DynamicFormComponent implements OnInit, OnChanges {
  @Input() fields: FieldConfig[] = [];

  @Input() formName: string;

  @Input() readOnly: boolean;

  @Output() submit: EventEmitter<any> = new EventEmitter<any>();

  @ViewChildren(DynamicFieldDirective) dynamicFields: QueryList<DynamicFieldDirective>;

  form: FormGroup;

  get value() {
    return this.form.value;
  }
  constructor(private fb: FormBuilder) { }

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
      this.validateAllFormFields(this.form);
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
          this.bindValidations(field.validations || [])
        );
      }
      catch (e) {
        // Exception occured, this means validation is invalid, let's try without validation
        control = this.fb.control(
          field.value,
          this.bindValidations([])
        );
      }
      group.addControl(field.name, control);
    });
    return group;
  }

  bindValidations(validations: any) {
    if (validations.length > 0) {
      const validList = [];
      validations.forEach(valid => {
        validList.push(valid.validator);
      });
      return Validators.compose(validList);
    }
    return null;
  }

  validateAllFormFields(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(field => {
      const control = formGroup.get(field);
      control.markAsTouched({ onlySelf: true });
    });
  }
}
