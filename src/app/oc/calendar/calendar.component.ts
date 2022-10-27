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
import { AuthService, ConsoleLoggerService } from '../services';
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

interface EventInputResponse {
    object_name: string; //: "sondaggi",
    object_id: string; //: {"id_sondaggio": "130", "codice_azienda": "DEMO"},
    titolo: string; //: "Prg. 11 Processo di adeguamento a fini privacy - Alba Claudio Snc  Minimaxi Abbigliamento 0-18 - Alba Claudio (Minimaxi Abbigliamento)",
    descrizione: string; //: "Predisposizione regolamento aziendale (ruoli, policy trattamento dati, utilizzo dispositivi aziendali, etc.)\n\n",
    data_inizio: any; //: "2018-06-23T00:00:00.000Z",
    data_fine: Date; //: "2018-06-23T00:00:00.000Z",
    event_color: string; //: "green"
}

interface CalendarDayInfo {
    today: boolean;
    selected: boolean;
    day: number;
    events: EventInputResponse[];
}

interface SelectedDay {
    dayOfMonth: number;
    dayOfWeek: number;
    week: number;
    month: number;
    year: number;
    events: any[];
}

enum EventTiming {
    start,
    end,
    inProgress
};

const colors = ['red', 'green', 'blue', 'yellow', 'pink', 'cyan'];

@Component({
    selector: 'calendar-view',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrls: [
        'calendar.component.scss',
    ],
    templateUrl: 'calendar.component.html',
})
export class CalendarComponent  implements OnInit{
    
    constructor(
        private _calendarEventDialog: MatDialog,
        private _calendarService: CalendarService,
        private _authService: AuthService,
        private _console: ConsoleLoggerService
    ) {}

    daysOfWeek: string[] = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
    ];

    calendarDays: CalendarDayInfo[][] = [];

    curMoment = moment();
    curMonth = 0;
    curMonthName = '';
    curYear = 0;
    curYearName = '';
    curDate = '';
    
    selectedDay?: SelectedDay = null;
    
    isLoading: boolean = false;

    data: EventInputResponse[] = null;

    ngOnInit() {
        let _this = this;

        _this.isLoading = true;
        
        try {
            let subscription = _this._calendarService.getCalendarEvents(_this._authService.getCurrentCompany()).subscribe(
                response => {
                    
                    if(response.result === 'OK' && response.data && response.data.rows) {
                        _this.data = response.data.rows
                        .map(x => {
                            let res: EventInputResponse = x;
                            res.data_fine = res.data_fine? new Date(res.data_fine): null; //res.data_fine.split("T")[0]: "";
                            return res;
                        });
                        _this.curMoment = moment();
                        _this.calculate();
                    }
                    _this.isLoading = false;
                    subscription.unsubscribe();
                    subscription = null;
                },
                error => {
                    _this.isLoading = false;
                    console.log(error);
                    subscription.unsubscribe();
                    subscription = null;
                }
            );
        }
        catch(e){
            _this.isLoading = false;
        };
    }

    calculate() {
        this.curMonth = this.curMoment.month();
        this.curYear = this.curMoment.year();
        this.curMonthName = this.curMoment.format('MMMM');
        this.curYearName = this.curMoment.format('YYYY');
        this.curDate = this.curMoment.format('MMMM YYYY');
        this.createDaysMap();
    }

    goToToday() {
        this.curMoment = moment();
        this.calculate();
    }

    goToNextMonth() {
        this.clearSelection();
        this.curMoment.add(1, 'month');
        this.calculate();
    }

    goToPreviousMonth() {
        this.clearSelection();
        this.curMoment.subtract(1, 'month');
        this.calculate();
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

        // let allEvents = this.data;
        // .map(x => {
        //     let res: EventInputResponse = x;
        //     res.data_inizio = res.data_inizio? moment(res.data_inizio): null; //res.data_inizio.split("T")[0]: "";
        //     res.data_fine = res.data_fine? moment(res.data_fine): null; //res.data_fine.split("T")[0]: "";
        //     return res;
        // });
        // .filter((x: any) => {
        //         return parseInt(x.data_inizio.split("-")[0]) == this.curYear && parseInt(x.data_inizio.split("-")[1]) == this.curMonth + 1; 
        // });
        // console.log(allEvents);
            
        for(let i = 1; i < startingDayMoment.isoWeekday(); i++) {
            newData[curWeekOfMonth].push(null);
            curDayOfWeek++;
        }

        for(let i = 0; i < this.curMoment.daysInMonth(); i++) {
            if(curDayOfWeek == 7) {
                curWeekOfMonth++;
                curDayOfWeek = 0;
            }
            
            let dayDate = new Date(`${this.curYear}-${this.curMonth + 1}-${i+1}T00:00:00.000Z`);

            let events = this.data.filter(x => {
                if(!x.data_fine) {
                    return false;
                }
                else {
                    return x.data_fine.getFullYear() == dayDate.getFullYear() && x.data_fine.getMonth() == dayDate.getMonth() && x.data_fine.getDate() == dayDate.getDate();
                }
                // else if(x.data_inizio && !x.data_fine) {
                //     return false;
                // }                
                // if((!x.data_inizio || moment(x.data_inizio).isSame(dayDate) || moment(x.data_inizio).isBefore(dayDate)) 
                // && (!x.data_fine || moment(x.data_fine).isSame(dayDate) || moment(x.data_fine).isAfter(dayDate))){
                //     return true;
                // }
                // else{
                //     return false;
                // }
            });
            // .map((x, i) => {
            //     const dayEvent: EventInfo = {
            //         eventColor: x.event_color,
            //         eventInfo: x,
            //         eventTiming: EventTiming.start
            //     }
            //     return dayEvent;
            // });
            
            //2018-06-23T00:00:00.000Z
            newData[curWeekOfMonth].push({
                today: isCurMonthSame && today.date() == i+1,
                day: i + 1,
                events: events,
                selected: false
            });
            curDayOfWeek++;
        }

        for(let i = curDayOfWeek; i < 7; i++) {
            newData[curWeekOfMonth].push(null);
            curDayOfWeek++;
        }

        this.calendarDays = newData;
    }

    loadDayEvents(dayOfWeek: number, dayOfMonth: number, week: number) {
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
                events: this.calendarDays[week][dayOfWeek].events
            }
            this.calendarDays[week][dayOfWeek].selected = true;
        }
        else {
            this.clearSelection();
        }
        
        // this.showCalendarEventDialog();
    }

    showDayEvent(event: EventInputResponse) {
        this.showCalendarEventDialog(event);
    }

    getWeekByDay(day: number) {
        let weekNum = -1;
        this.calendarDays.forEach((curWeek, i) => {
            if(curWeek.filter(x => x && x.day == day).length > 0) {
                weekNum = i;
            }
        });
        return weekNum;
    }

    clearSelection() {
        if(this.selectedDay) {
            this.calendarDays[this.selectedDay.week][this.selectedDay.dayOfWeek].selected = false;
            this.selectedDay = null;
        }
    }

    showCalendarEventDialog(event: EventInputResponse) {
        const _this = this;
        const data: CalendarEventDetails = {
            title: event.titolo,
            calendar: "Predefined",
            startDate: event.data_inizio? new Date(event.data_inizio).toDateString(): "",
            endDate: event.data_fine? event.data_fine.toDateString(): "",
            organizer: "Zee",
            attachment: "https://auditft.it/",
            participants: ["Zee", "Davide", "Amedeo", "Nicola"],
            description: event.descrizione,
            object_id: event.object_id,
            object_name: event.object_name
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