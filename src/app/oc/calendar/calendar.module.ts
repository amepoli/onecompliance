import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { CalendarEventDialogModule } from '../dialogs/calendar-event.dialog/calendar-event.dialog.module';
import { CalendarComponent } from './calendar.component';

@NgModule({
    declarations: [CalendarComponent
    ],
    imports: [
        CommonModule,
        MatButtonModule,

        CalendarEventDialogModule
        // BrowserAnimationsModule,
    ],
    exports: [CalendarComponent
        // CalendarPreviousViewDirective
    ]
})
export class CalendarModule { }
