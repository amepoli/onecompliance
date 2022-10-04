import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { CalendarComponent } from './calendar.component';

@NgModule({
    declarations: [CalendarComponent
    ],
    imports: [
        CommonModule,
        MatButtonModule,
        // BrowserAnimationsModule,
    ],
    exports: [CalendarComponent
        // CalendarPreviousViewDirective
    ]
})
export class CalendarModule { }
