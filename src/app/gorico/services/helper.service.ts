import { Injectable, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';
// import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { Observable, BehaviorSubject } from 'rxjs';
import { ToastService } from './toast.service';
import { ActivatedRoute, Router } from '@angular/router';
import { BackendService } from '../views/backend/backend.service';
import { NgxPubSubService } from '@pscoped/ngx-pub-sub';
import { AuthService } from '../login-page/auth.service';
import { DialogService } from './dialog.service';
import { MatDialog } from '@angular/material';
import { ImportDialogComponent } from '../dialogs/import.dialog/import.dialog.component';

export interface MarkerReplacer {
    marker: string;
    replace: Function
};

@Injectable({
    providedIn: 'root'
})
export class HelperService {


    // Constants
    public static CONSTANTS = {
        CURRENT_DATE: {
            marker: '£CURRENT_DATE£',
            replace: (context: any, value: string) => { return context.replaceAll(value, '£CURRENT_DATE£', context.getCurrentDate()); }
        }
    };

    /**
     * Constructor
     *
     */
    constructor() {
    }


    /**
     * Replace all occurences of search pattern in string
     * @param str
     * @param find
     * @param replace
     * @returns new string
     */
    public static replaceAll(str, find, replace) {
        return str.replace(new RegExp(find, 'g'), replace);
    }

    /**
     * Get Formatted Month Day
     * @param value
     * @returns 2 digit formatted month or day
     */
    public static getFormattedMonthDay(value: number) {
        return (value > 9 ? `${value}` : `0${value}`);
    }

    /**
     * Get Current Date
     * @returns formatted date
     */
    public static getCurrentDate() {
        // Example formatted date
        // "2017-09-25T00:00:00.000Z"
        let current_datetime = new Date();
        let formatted_date = `${current_datetime.getFullYear()}-${this.getFormattedMonthDay(current_datetime.getMonth() + 1)}-${this.getFormattedMonthDay(current_datetime.getDate())}T00:00:00.000Z`;
        return formatted_date;
    }

    /**
     * Format the string by replacing all occurences of constants
     * @param input
     * @returns Formatted string
     */
    public static getFormattedString(input: string) {
        let result: string = input;
        Object.keys(this.CONSTANTS).forEach(c => {
            result = (this.CONSTANTS[c] as MarkerReplacer).replace(this, result);
        });
        return result;
    }
}

