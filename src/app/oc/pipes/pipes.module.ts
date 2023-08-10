import { NgModule } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { OCTranslatePipe } from './octranslate.pipe';
import { OneCompliancePipe } from './onecompliance.pipe';

@NgModule({
    declarations: [
        OneCompliancePipe,
        OCTranslatePipe
    ],
    imports     : [
    ],
    exports     : [
        OneCompliancePipe,
        OCTranslatePipe
    ]
})
export class OneCompliancePipesModule
{
}
