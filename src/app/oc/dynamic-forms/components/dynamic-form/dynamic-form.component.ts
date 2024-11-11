import {
    Component,
    EventEmitter,
    Input,
    OnChanges,
    OnInit,
    Output,
    ViewChildren,
    QueryList,
    SimpleChanges,
} from "@angular/core";
import { UntypedFormGroup, UntypedFormBuilder } from "@angular/forms";
import { FormsService, ValidationsService } from "app/oc/services";
import { FieldConfig } from "app/oc/interfaces";
import { DynamicFieldDirective } from "app/oc/directives";

@Component({
    exportAs: "dynamicForm",
    selector: "dynamic-form",
    templateUrl: "./dynamic-form.component.html",
    styleUrls: ["./dynamic-form.component.scss"],
})
export class DynamicFormComponent implements OnInit, OnChanges {
    @Input() isQuickAdd: boolean = false;

    @Input() fields: FieldConfig[] = [];

    @Input() formName: string;

    @Input() readOnlyPage: boolean;

    @Output() submit: EventEmitter<any> = new EventEmitter<any>();

    @ViewChildren(DynamicFieldDirective)
    dynamicFields: QueryList<DynamicFieldDirective>;

    form: UntypedFormGroup;

    get value() {
        return this.form.value;
    }
    constructor(
        private fb: UntypedFormBuilder,
        private formsService: FormsService,
    ) {}

    ngOnInit() {
        //this.form = this.createControl();
    }

    visibleFields: FieldConfig[] = [];

    ngOnChanges(changes: SimpleChanges) {
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
        this.visibleFields = this.fields;
            // .filter(x => x.isVisible);
            // .filter((x) => !(!x.isVisible && x.subform));
        return this.formsService.createControl(this.fb, this.visibleFields);
    }
}
