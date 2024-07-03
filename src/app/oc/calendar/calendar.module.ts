import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule as MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';
import { CalendarEventDialogModule } from '../dialogs/calendar-event.dialog/calendar-event.dialog.module';
import { CalendarComponent } from './calendar.component';


const routes = [
    {
      path: 'oc/calendar',
      component: CalendarComponent
    }
  ];

@NgModule({
    declarations: [CalendarComponent
    ],
    imports: [
        CommonModule,
        RouterModule.forChild(routes),
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        CalendarEventDialogModule
        // BrowserAnimationsModule,
    ],
    exports: [CalendarComponent
        // CalendarPreviousViewDirective
    ]
})
export class CalendarModule { }
