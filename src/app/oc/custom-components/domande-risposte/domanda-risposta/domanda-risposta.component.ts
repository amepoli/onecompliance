import { Component, EventEmitter, Input, OnChanges, Output, ViewChildren, QueryList, SimpleChanges } from "@angular/core";
import { UntypedFormGroup, UntypedFormBuilder } from "@angular/forms";
import { FormsService, ValidationsService } from "app/oc/services";
import { FieldConfig } from "app/oc/interfaces";
import { DynamicFieldDirective } from "app/oc/directives";
import { memoize } from "app/oc/decorators/memoize";

@Component({
    exportAs: "dynamicForm",
    selector: "domanda-risposta",
    templateUrl: "./domanda-risposta.component.html",
    styleUrls: ["./domanda-risposta.component.scss"],
})
export class DomandaRispostaComponent implements OnChanges {
    @Input() isQuickAdd: boolean = false;

    @Input() fields: FieldConfig[] = [];

    @Input() formName: string;

    @Input() readOnlyPage: boolean;

    @Output() submit: EventEmitter<any> = new EventEmitter<any>();

    @ViewChildren(DynamicFieldDirective)
    dynamicFields: QueryList<DynamicFieldDirective>;

    form: UntypedFormGroup = null;

    get value() {
        return this.form.value;
    }
    
    constructor(
        private fb: UntypedFormBuilder,
        private formsService: FormsService,
    ) {}

    @memoize()
    ngOnChanges(changes: SimpleChanges) {
        if(this.fields) {
            this.form = this.formsService.createControl(this.fb, this.fields);
        }
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
}
