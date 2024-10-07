import { NgModule } from "@angular/core";
import { DynamicFieldDirective } from "./dynamic-field.directive";
import { OCTooltipDirective } from "./octooltip.directive";

@NgModule({
    declarations: [DynamicFieldDirective, OCTooltipDirective],
    imports: [],
    exports: [DynamicFieldDirective, OCTooltipDirective],
})
export class OneComplianceDirectivesModule {}
