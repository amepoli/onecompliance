import { Directive, Input, OnInit, ViewContainerRef } from "@angular/core";
import { UntypedFormGroup } from "@angular/forms";
import { FieldConfig } from "app/oc/interfaces";
import { FormsService } from "../services";


@Directive({
    selector: "[dynamicField]",
})
export class DynamicFieldDirective implements OnInit {
    @Input() field: FieldConfig;
    @Input() group: UntypedFormGroup;
    @Input() readOnlyPage: boolean;
    componentRef: any;
    constructor(private container: ViewContainerRef, private formsService: FormsService) { }
    ngOnInit() {
        this.componentRef = this.formsService.createComponent(this.container, this.field.type);
        this.componentRef.instance.field = this.field;
        this.componentRef.instance.group = this.group;
        this.componentRef.instance.readOnlyPage = this.readOnlyPage;
    }
}
