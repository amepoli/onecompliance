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


    /**
     * Markers
     */
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
        if (str != null && str.length > 0) {
            return str.replace(new RegExp(find, 'g'), replace);
        }
        else {
            return str;
        }
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
     * Get formatted Date
     * @param date 
     * @returns formatted date
     */
    public static getFormattedDate(dateTime) {
        // Example formatted date
        // "2017-09-25T00:00:00.000Z"
        let formattedDate = `${dateTime.getFullYear()}-${this.getFormattedMonthDay(dateTime.getMonth() + 1)}-${this.getFormattedMonthDay(dateTime.getDate())}T00:00:00.000Z`;
        return formattedDate;
    }

    /**
     * Get Current Date
     * @returns formatted date
     */
    public static getCurrentDate() {
        // Example formatted date
        // "2017-09-25T00:00:00.000Z"
        let dateTime = new Date();
        return this.getFormattedDate(dateTime);
    }

    /**
     * Format the string by replacing all occurences of markers
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


    /**
     * Get css style name from json compatible key
     * @param styleKey
     * @returns CSS Style name
     */
    public static getStyleName(styleKey) {
        switch (styleKey) {
            default: case 'font_color':
                return 'color';
            case 'background_color':
                return 'background-color';
            case 'font_size':
                return 'font-size';
            case 'font_style':
                return 'font-style';
            case 'font_weight':
                return 'font-weight';
        }
    }
}

