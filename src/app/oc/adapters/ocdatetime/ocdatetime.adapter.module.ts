import { NgModule } from "@angular/core";
import {
    NgxMatDateAdapter,
    NgxMatDateFormats,
    NGX_MAT_DATE_FORMATS,
} from "@angular-material-components/datetime-picker";
import { NGX_MAT_MOMENT_DATE_ADAPTER_OPTIONS } from "@angular-material-components/moment-adapter";
import { MAT_DATE_LOCALE } from "@angular/material/core";
import { OCDatetimeAdapter } from "./ocdatetime.adapter";

const CUSTOM_DATE_FORMATS: NgxMatDateFormats = {
    parse: {
        dateInput: "l, LTS",
    },
    display: {
        //dateInput: "YYYY-MM-DD HH:mm:ss",
        dateInput: "DD/MM/YYYY, HH:mm:ss",
        monthYearLabel: "MMM YYYY",
        dateA11yLabel: "LL",
        monthYearA11yLabel: "MMMM YYYY",
    },
};

@NgModule({
    providers: [
        {
            provide: NgxMatDateAdapter,
            useClass: OCDatetimeAdapter,
            deps: [MAT_DATE_LOCALE, NGX_MAT_MOMENT_DATE_ADAPTER_OPTIONS],
        },
        { provide: NGX_MAT_DATE_FORMATS, useValue: CUSTOM_DATE_FORMATS },
    ],
})
export class OCDateTimeModule {}
