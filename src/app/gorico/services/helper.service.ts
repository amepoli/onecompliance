import { Injectable } from '@angular/core';

export interface MarkerReplacer {
    /**
     * Marker
     */
    marker: string;
    replace:
    /**
     * Replace marker with value
     * @param context you should pass 'this' as context
     * @param value value to replace with marker
     * @returns replaced string 
     */
    (context: any, value: string) => string;
};

@Injectable({
    providedIn: 'root'
})
export class HelperService {


    // Constants
    public static MARKERS = {
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
        Object.keys(this.MARKERS).forEach(c => {
            result = (this.MARKERS[c] as MarkerReplacer).replace(this, result);
        });
        return result;
    }
}

