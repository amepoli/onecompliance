import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { FieldConfig } from '../dynamic-forms/field.interface';

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
    public static getTwoDigitText(value: number) {
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
        let date = new Date(dateTime);
        //We use dayCorrector to remove the timezone. We want brut date without any timezone
        let dayCorrector = (date.getHours()>12) ? (1) : (0); //(date.getHours()<=12) ? (-1) : (0);
        date.setDate(date.getDate()+dayCorrector);
        let dateFinal = `${date.getFullYear()}-${this.getTwoDigitText(date.getMonth() + 1)}-${this.getTwoDigitText(date.getDate())}T00:00:00.000Z`;
        return dateFinal;

        // Old method
        // let formattedDate = `${dateTime.getFullYear()}-${this.getTwoDigitText(dateTime.getMonth() + 1)}-${this.getTwoDigitText(dateTime.getDate())}T00:00:00.000Z`;
        // return formattedDate;
    }

    /**
     * Get formatted DateTime
     * @param datetime
     * @returns formatted date time
     */
    public static getFormattedDateTime(dateTime) {
        // Example formatted date
        // "2017-09-25T00:00:00.000Z"
        let date = new Date(dateTime);
        //We use dayCorrector to remove the timezone. We want brut date without any timezone
        // let dayCorrector = (date.getHours()>12) ? (1) : (0); //(date.getHours()<=12) ? (-1) : (0);
        // date.setDate(date.getDate()+dayCorrector);
        let dateTimeFinal = `${date.getFullYear()}-${this.getTwoDigitText(date.getMonth() + 1)}-${this.getTwoDigitText(date.getDate())}T${this.getTwoDigitText(date.getHours())}:${this.getTwoDigitText(date.getMinutes())}:${this.getTwoDigitText(date.getSeconds())}.000Z`;
        return dateTimeFinal;

        // Old method
        // let formattedDate = `${dateTime.getFullYear()}-${this.getTwoDigitText(dateTime.getMonth() + 1)}-${this.getTwoDigitText(dateTime.getDate())}T00:00:00.000Z`;
        // return formattedDate;
    }

    /**
     * Get formatted Time
     * @param time 
     * @returns formatted time
     */
    public static getFormattedTime(time) {
        return time;
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
            case 'text_align':
                return 'text-align';
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

    /**
     * Find element by recursively checking subforms
     * @param form form to check element
     * @param name name of the field to find
     * @returns element
     */
    public static findElement(form: FieldConfig[], name: string) {
        let element = null;
        form.forEach(field => {
            if (field.name === name) {
                element = field;
            }
            if (field.subform && !element) {
                let findResult = this.findElement(field.subform, name);
                if (findResult) {
                    element = findResult;
                }
            }
        });
        return element;
    }


    /**
     * Redirect to Uri
     * @param router Router
     * @param uri Uri
     */
    public static redirectTo(router: Router, uri: string) {
        router.navigate([`/redirect/${encodeURIComponent(uri)}`]);

        // router.navigateByUrl('/', { skipLocationChange: true }).then(() =>
        //     router.navigate([uri]));
    }

}

