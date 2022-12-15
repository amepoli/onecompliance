import { NgModule } from "@angular/core";
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from "@angular/material/core";


import { OCDateAdapter } from "./ocdate.adapter";

const CUSTOM_DATE_FORMATS = {
    parse: {
        // dateInput: 'LL'
        dateInput: { day: "numeric", month: "numeric", year: "numeric" },
    },
    display: {
        //dateInput: "YYYY-MM-DD",
        dateInput: "DD/MM/YYYY",
        monthYearLabel: 'YYYY',
        dateA11yLabel: 'LL',
        monthYearA11yLabel: 'YYYY'
    }
};

@NgModule({
    providers: [
        // { provide: MAT_DATE_LOCALE, useValue: 'it-IT' },
        { provide: DateAdapter, useClass: OCDateAdapter },
        { provide: MAT_DATE_FORMATS, useValue: CUSTOM_DATE_FORMATS },
    ],
})
export class OCDateModule {}
