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
  FormGroup,
  FormBuilder
} from '@angular/forms';
import { ValidationsService } from 'app/gorico/services/validations.service';
import { FieldConfig } from '../../field.interface';
import { DynamicFieldDirective } from '../dynamic-field/dynamic-field.directive';

@Component({
  exportAs: 'dynamicForm',
  selector: 'dynamic-form',
  template: `
  <form [style.margin-left]="'1%'" [style.background-color]="isQuickAdd? 'lightyellow': 'transparent'" class='dynamic-form' [id]='formName' [formGroup]='form' (submit)='onSubmit($event)'>
  <ng-container *ngFor='let field of fields;' dynamicField [field]='field' [group]='form' [readOnlyPage]='readOnlyPage'>
  </ng-container>
  </form>
  `,
  styleUrls: ['./dynamic-form.component.scss']
})
export class DynamicFormComponent implements OnInit, OnChanges {
  @Input() isQuickAdd: boolean = false;

  @Input() fields: FieldConfig[] = [];

  @Input() formName: string;

  @Input() readOnlyPage: boolean;

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
