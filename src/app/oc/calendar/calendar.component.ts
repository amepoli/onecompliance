import {
    Component,
    ChangeDetectionStrategy,
    ViewChild,
    TemplateRef,
    OnInit,
} from '@angular/core';
import {
    startOfDay,
    endOfDay,
    subDays,
    addDays,
    endOfMonth,
    isSameDay,
    isSameMonth,
    addHours,
} from 'date-fns';
import { Subject } from 'rxjs';
//   import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
// import {
//     CalendarEvent,
//     CalendarEventAction,
//     CalendarEventTimesChangedEvent,
//     CalendarView,
// } from 'angular-calendar';
// import { EventColor } from 'calendar-utils';
import * as moment from 'moment';
import { MatDialog } from '@angular/material/dialog';
import { CalendarEventDialogComponent } from '../dialogs/calendar-event.dialog/calendar-event.dialog.component';
import { CalendarService } from '../services/calendar.service';
import { AuthService } from '../services';
import { CalendarEventDetails } from '../interfaces';


// const colors: Record<string, EventColor> = {
//     red: {
//         primary: '#ad2121',
//         secondary: '#FAE3E3',
//     },
//     blue: {
//         primary: '#1e90ff',
//         secondary: '#D1E8FF',
//     },
//     yellow: {
//         primary: '#e3bc08',
//         secondary: '#FDF1BA',
//     },
// };

interface CalendarDayInfo {
    today: boolean;
    selected: boolean;
    day: number;
    numEvents: number;
}

interface SelectedDay {
    dayOfMonth: number;
    dayOfWeek: number;
    week: number;
    month: number;
    year: number;
    events: any[];
}

@Component({
    selector: 'calendar-view',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrls: [
        'calendar.component.scss',
    ],
    templateUrl: 'calendar.component.html',
})
export class CalendarComponent  implements OnInit{
    daysOfWeek: string[] = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
    ];

    data: CalendarDayInfo[][] = [];

    curMoment = moment();
    curMonth = 0;
    curMonthName = '';
    curYear = 0;
    curYearName = '';
    curDate = '';
    
    selectedDay?: SelectedDay = null;
    
    isLoading: boolean = true;

    async ngOnInit() {
        let _this = this;

        _this.isLoading = true;
        
        // try {
        //     const response = await _this._calendarService.getCalendarEvents(_this._authService.getCurrentCompany()).toPromise();
        //     console.log(response);
            _this.curMoment = moment();
            _this.calculateCur();
            _this.isLoading = false;
        // }
        // catch(e){
        //     _this.isLoading = false;
        //     console.log(e);
        // };
    }

    calculateCur() {
        this.curMonth = this.curMoment.month();
        this.curYear = this.curMoment.year();
        this.curMonthName = this.curMoment.format('MMMM');
        this.curYearName = this.curMoment.format('YYYY');
        this.curDate = this.curMoment.format('MMMM YYYY');
        this.createDaysMap();
    }

    goToToday() {
        this.curMoment = moment();
        this.calculateCur();
    }

    goToNextMonth() {
        this.clearSelection();
        this.curMoment.add(1, 'month');
        this.calculateCur();
    }

    goToPreviousMonth() {
        this.clearSelection();
        this.curMoment.subtract(1, 'month');
        this.calculateCur();
    }

    createDaysMap() {
        this.clearSelection();
        const today = moment();
        const isCurMonthSame: boolean = today.year() == this.curMoment.year() && today.month() == this.curMoment.month();
        const startingDayMoment = this.curMoment.set('D', 1);
        
        let newData: CalendarDayInfo[][] = [];
        newData.push([]);
        newData.push([]);
        newData.push([]);
        newData.push([]);
        newData.push([]);
        newData.push([]);

        let curDayOfWeek = 0;
        let curWeekOfMonth = 0;

        for(let i = 1; i < startingDayMoment.isoWeekday(); i++) {
            newData[curWeekOfMonth].push(null);
            curDayOfWeek++;
        }

        for(let i = 0; i < this.curMoment.daysInMonth(); i++) {
            if(curDayOfWeek == 7) {
                curWeekOfMonth++;
                curDayOfWeek = 0;
            }
            newData[curWeekOfMonth].push({
                today: isCurMonthSame && today.date() == i+1,
                day: i + 1,
                numEvents: 0,
                selected: false
            });
            curDayOfWeek++;
        }

        for(let i = curDayOfWeek; i < 7; i++) {
            newData[curWeekOfMonth].push(null);
            curDayOfWeek++;
        }

        this.data = newData;
    }

    loadDayEvent(dayOfWeek: number, dayOfMonth: number, week: number) {
        if(!this.selectedDay ||
            this.selectedDay.year != this.curYear || 
            this.selectedDay.month != this.curMonth ||
            this.selectedDay.dayOfMonth != dayOfMonth || 
            this.selectedDay.dayOfWeek != dayOfWeek || 
            this.selectedDay.dayOfMonth != dayOfMonth
            ) {
                
            this.clearSelection();
            this.selectedDay = {
                dayOfMonth: dayOfMonth,
                dayOfWeek: dayOfWeek,
                week: week, //this.getWeekByDay(day),
                month: this.curMonth,
                year: this.curYear,
                events: [
                    {name: "Event 1"},
                    {name: "Event 2"}
                ]
            }
            this.data[week][dayOfWeek].selected = true;
        }
        else {
            this.clearSelection();
        }
        

        console.log(this.selectedDay);

        this.showCalendarEventDialog();
    }

    getWeekByDay(day: number) {
        let weekNum = -1;
        this.data.forEach((curWeek, i) => {
            if(curWeek.filter(x => x && x.day == day).length > 0) {
                weekNum = i;
            }
        });
        return weekNum;
    }

    clearSelection() {
        if(this.selectedDay) {
            this.data[this.selectedDay.week][this.selectedDay.dayOfWeek].selected = false;
            this.selectedDay = null;
        }
    }

    constructor(private _calendarEventDialog: MatDialog,
        private _calendarService: CalendarService,
        private _authService: AuthService
    ) {}

    showCalendarEventDialog() {
        const _this = this;
        const data: CalendarEventDetails = {
            title: 'Demo event 1',
            calendar: "Predefined",
            startDate: "22 October, 2022",
            endDate: "24 October, 2022",
            organizer: "Zee",
            attachment: "https://auditft.it/",
            participants: ["Zee", "Davide", "Amedeo", "Nicola"],
            description: "This is a demo event"
        }
        // Pop-up example
        const dialogRef = _this._calendarEventDialog.open(CalendarEventDialogComponent, {
            width: '640px',
            height: '840px',
            data: data
        });

        let subscriptions: any = [];

        subscriptions.push(dialogRef.afterClosed().subscribe(result => {
            if (result) {
            }
        }));
    }




    /*
    @ViewChild('modalContent', { static: true }) modalContent: TemplateRef<any>;

    view: CalendarView = CalendarView.Month;

    CalendarView = CalendarView;

    viewDate: Date = new Date();

    modalData: {
        action: string;
        event: CalendarEvent;
    };

    actions: CalendarEventAction[] = [
        {
            label: '<i class="fas fa-fw fa-pencil-alt"></i>',
            a11yLabel: 'Edit',
            onClick: ({ event }: { event: CalendarEvent }): void => {
                this.handleEvent('Edited', event);
            },
        },
        {
            label: '<i class="fas fa-fw fa-trash-alt"></i>',
            a11yLabel: 'Delete',
            onClick: ({ event }: { event: CalendarEvent }): void => {
                this.events = this.events.filter((iEvent) => iEvent !== event);
                this.handleEvent('Deleted', event);
            },
        },
    ];


    refresh = new Subject<void>();

    events: CalendarEvent[] = [
        {
            start: subDays(startOfDay(new Date()), 1),
            end: addDays(new Date(), 1),
            title: 'A 3 day event',
            color: { ...colors.red },
            actions: this.actions,
            allDay: true,
            resizable: {
                beforeStart: true,
                afterEnd: true,
            },
            draggable: true,
        },
        {
            start: startOfDay(new Date()),
            title: 'An event with no end date',
            color: { ...colors.yellow },
            actions: this.actions,
        },
        {
            start: subDays(endOfMonth(new Date()), 3),
            end: addDays(endOfMonth(new Date()), 3),
            title: 'A long event that spans 2 months',
            color: { ...colors.blue },
            allDay: true,
        },
        {
            start: addHours(startOfDay(new Date()), 2),
            end: addHours(new Date(), 2),
            title: 'A draggable and resizable event',
            color: { ...colors.yellow },
            actions: this.actions,
            resizable: {
                beforeStart: true,
                afterEnd: true,
            },
            draggable: true,
        },
    ];

    activeDayIsOpen: boolean = true;

    constructor(
        // private modal: NgbModal
    ) { }

    dayClicked({ date, events }: { date: Date; events: CalendarEvent[] }): void {
        if (isSameMonth(date, this.viewDate)) {
            if (
                (isSameDay(this.viewDate, date) && this.activeDayIsOpen === true) ||
                events.length === 0
            ) {
                this.activeDayIsOpen = false;
            } else {
                this.activeDayIsOpen = true;
            }
            this.viewDate = date;
        }
    }

    eventTimesChanged({
        event,
        newStart,
        newEnd,
    }: CalendarEventTimesChangedEvent): void {
        this.events = this.events.map((iEvent) => {
            if (iEvent === event) {
                return {
                    ...event,
                    start: newStart,
                    end: newEnd,
                };
            }
            return iEvent;
        });
        this.handleEvent('Dropped or resized', event);
    }

    handleEvent(action: string, event: CalendarEvent): void {
        this.modalData = { event, action };
        //   this.modal.open(this.modalContent, { size: 'lg' });
    }

    addEvent(): void {
        this.events = [
            ...this.events,
            {
                title: 'New event',
                start: startOfDay(new Date()),
                end: endOfDay(new Date()),
                color: colors.red,
                draggable: true,
                resizable: {
                    beforeStart: true,
                    afterEnd: true,
                },
            },
        ];
    }

    deleteEvent(eventToDelete: CalendarEvent) {
        this.events = this.events.filter((event) => event !== eventToDelete);
    }

    setView(view: CalendarView) {
        this.view = view;
    }

    closeOpenMonthViewDay() {
        this.activeDayIsOpen = false;
    }
    */
}