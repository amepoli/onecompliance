import { EventEmitter, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { FieldConfig, MarkerReplacer } from 'app/oc/interfaces';
import * as moment from 'moment';
interface TableStyleElement {
    value: string;
    valueKey?: string;
    condition: string;
    style: any;
}

@Injectable({
    providedIn: 'root'
})
export class HelperService {

    // Event Emitter for naviate requests
    public static navigateRequested: EventEmitter<any> = new EventEmitter();

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
        let dayCorrector = (date.getHours() > 12) ? (1) : (0); //(date.getHours()<=12) ? (-1) : (0);
        date.setDate(date.getDate() + dayCorrector);
        let dateFinal = `${date.getFullYear()}-${this.getTwoDigitText(date.getMonth() + 1)}-${this.getTwoDigitText(date.getDate())}T00:00:00.000Z`;
        return dateFinal;

        // Old method
        // let formattedDate = `${dateTime.getFullYear()}-${this.getTwoDigitText(dateTime.getMonth() + 1)}-${this.getTwoDigitText(dateTime.getDate())}T00:00:00.000Z`;
        // return formattedDate;
    }


    /**
     * Get formatted short Date
     * @param date 
     * @returns formatted date
     */
    public static getFormattedShortDate(dateTime) {
        // Example formatted date
        // "2017-09-25T00:00:00.000Z"
        let date = new Date(dateTime);
        //We use dayCorrector to remove the timezone. We want brut date without any timezone
        let dayCorrector = (date.getHours() > 12) ? (1) : (0); //(date.getHours()<=12) ? (-1) : (0);
        date.setDate(date.getDate() + dayCorrector);
        let dateFinal = `${date.getFullYear()}${this.getTwoDigitText(date.getMonth() + 1)}${this.getTwoDigitText(date.getDate())}`;
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
    public static getFormattedDateTime(dateTime: any, timezone: string = 'Z') {
        //Check the format and fix it is not Long Date time
        if (typeof dateTime === 'string' && dateTime.includes(',')) {
            // This was manually added and so we need to format it
            const parts = dateTime.replace(' ', '').split(',');
            const dateParts = parts[0].split('/');
            const timeParts = parts[1].split(':');
            try {
                let dateTimeFinal = `${dateParts[2]}-${this.getTwoDigitText(parseInt(dateParts[1]))}-${this.getTwoDigitText(parseInt(dateParts[0]))}T${this.getTwoDigitText(parseInt(timeParts[0]))}:${this.getTwoDigitText(parseInt(timeParts[1]))}:${this.getTwoDigitText(parseInt(timeParts[2]))}.000${timezone}`;
                return dateTimeFinal;
            }
            catch (e) {
                console.log(e);
                return null;
            }

        }
        else {
            // Example formatted date
            // "2017-09-25T00:00:00.000Z"
            let date = new Date(dateTime);
            //We use dayCorrector to remove the timezone. We want brut date without any timezone
            // let dayCorrector = (date.getHours()>12) ? (1) : (0); //(date.getHours()<=12) ? (-1) : (0);
            // date.setDate(date.getDate()+dayCorrector);
            let dateTimeFinal = `${date.getFullYear()}-${this.getTwoDigitText(date.getMonth() + 1)}-${this.getTwoDigitText(date.getDate())}T${this.getTwoDigitText(date.getHours())}:${this.getTwoDigitText(date.getMinutes())}:${this.getTwoDigitText(date.getSeconds())}.000${timezone}`;
            return dateTimeFinal;

            // Old method
            // let formattedDate = `${dateTime.getFullYear()}-${this.getTwoDigitText(dateTime.getMonth() + 1)}-${this.getTwoDigitText(dateTime.getDate())}T00:00:00.000Z`;
            // return formattedDate;
        }
    }

    /**
     * Get formatted Time
     * @param time 
     * @returns formatted time
     */
    public static getFormattedTime(time: string) {
        if(time) {
            let parts = time.split(':')
            let ampm = 'AM';
            if(parts.length > 2) {
                return moment(time, ["HH:mm:ss"]).format("h:mm A")
                // let hours = parseInt(parts[0]);
                // if(hours > 12) {
                //     parts[0] = this.getTwoDigitText(12 - hours);
                //     ampm = 'PM';
                // }
                // return `${parts[0]}:${parts[1]} ${ampm}`
            }
        }
        return time;
    }

    /**
     * Get decoded Time
     * @param time 
     * @returns decoded time
     */
    public static getDecodedTime(time: string) {
        if(time) {
            
            let mainParts = time.split(' ');
            if (mainParts.length > 1) {
                return moment(time, ["h:mm A"]).format("HH:mm:ss")
                // let parts = mainParts[0].split(':')
                // let hours = parseInt(parts[0]);
                // if (mainParts[1] === 'PM') {
                //     parts[0] = this.getTwoDigitText(12 + hours);
                // }
                // return `${parts[0]}:${parts[1]}:00`
            }
        }
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
            case 'border_radius':
                return 'border-radius';
        }
    }
   
      /**
     * Get css style name from json compatible key
     * @param value
     * @param style
     * @returns CSS Style name
     */
      public static getStyleByValue(value, columnStyles, row, styleKeysToIgnore) {
        let completeStyle: any = null;
        
        if(Array.isArray(columnStyles)) {
            const valuedStyles = (columnStyles as TableStyleElement[]).filter(x => x.value !== "*");
            (valuedStyles as TableStyleElement[]).forEach(element => {
                const elementValue = element.valueKey? row[element.valueKey]?.toString() ?? null: element.value?.toString() ?? null;
                const searchValue = value?.toString() ?? null;
                if(elementValue !== null && searchValue !== null) {
                    switch(element.condition) {
                        case "==":
                            if(searchValue == elementValue)
                            {               
                                completeStyle = element.style;
                            }
                            break;
                        case "!=":
                            if(searchValue !== elementValue)
                            {               
                                completeStyle = element.style;
                            }
                            break;
                        case ">=":
                            if(parseInt(searchValue) >= parseInt(elementValue))
                            {               
                                completeStyle =  element.style;
                            }
                            break;
                        case ">":
                            if(parseInt(searchValue) > parseInt(elementValue))
                            {               
                                completeStyle =  element.style;
                            }
                            break;
                        case "<=":
                            if(parseInt(searchValue) <= parseInt(elementValue))
                            {               
                                completeStyle =  element.style;
                            }
                            break;
                        case "<":
                            if(parseInt(searchValue) < parseInt(elementValue))
                            {               
                                completeStyle =  element.style;
                            }
                            break;
                        default: 
                            break;
                    }            
                }
            });

            if(completeStyle === null) {
                if((columnStyles as TableStyleElement[]).filter(x => x.value === "*").length > 0) {
                    completeStyle = (columnStyles as TableStyleElement[]).filter(x => x.value === "*")[0].style;
                }
                else {
                    completeStyle = {};
                }
            }
        }
        else {
            completeStyle = {};
        }

        let result = {};
        
        Object.keys(completeStyle).forEach(key => {
            if (!styleKeysToIgnore.includes(key)) {
                result[HelperService.getStyleName(key)] = completeStyle[key];
            }
        });

        return result;
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
     * Request Navigate
     * @param entry
     * @param keys
     */
    public static navigateTo(entry: string, type: string, keys: object) {
        let params = {
            entry: { name: entry, type: type },
            index: 1,
            keys: [
                keys
            ]
        };

        this.navigateRequested.emit({ eventType: "navigate", queryParams: params });
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

    /**
     * Get form values
     */
    public static getFormValues(formValues: any): any {
        // process the booleans (1/0 instead of true/false)
        for (const value in formValues) {
            if (formValues.hasOwnProperty(value)) {
                const element = formValues[value];
                if (element == null) {
                    continue; // skip null entries
                }
                // decode combos
                if (element['id'] != null) {
                    formValues[value] = element['id'];
                }
                // encode boolean
                else if (element === true) {
                    formValues[value] = '1';
                }
                else if (element === false) {
                    formValues[value] = '0';
                }
            }
        }
        return formValues;
    }

    /**
     * Get value in ValueSet
     * @param valueSet value set
     * @param key key to find value
     * @returns value
     */
    public static getValueInValueSet(valueSet: object, key: string) {
        const valueEl = valueSet[key];
        if (typeof valueEl === 'object' && valueEl !== null) {
            return valueEl['value'];
        }
        else {
            return valueEl;
        }
    }


    /**
     * Refresh application
     */
    public static refreshApp() {
        return window.location.reload();
    }

    /**
     * Add Short Date in File Name
     * @param fileName file name
     * @returns newFileNameWithDate
     */
    public static addShortDateInFileName(fileName: string) {
        if (fileName) {
            const fileNameParts = fileName.split('.');
            const ext = fileNameParts.pop();
            return `${fileNameParts.join('.')}_${this.getFormattedShortDate(new Date())}.ext`;
        }
        return '';

    }

    public static generatePassword(pwLength: number = 8) {
        var pass = '';
        const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
        const numberChars = '0123456789';
        const specialChars = '@$%!?&_';
        const allChars = uppercaseChars + lowercaseChars + numberChars + specialChars;

        pass += uppercaseChars.charAt(Math.floor(Math.random() * uppercaseChars.length));
        pass += lowercaseChars.charAt(Math.floor(Math.random() * lowercaseChars.length));
        pass += numberChars.charAt(Math.floor(Math.random() * numberChars.length));
        pass += specialChars.charAt(Math.floor(Math.random() * specialChars.length));

        for (let i = 5; i <= pwLength; i++) {
            var char = Math.floor(Math.random()
                * allChars.length + 1);

            pass += allChars.charAt(char);
        }

        // Shuffle the password to randomize the positions of the required characters
        pass = pass.split('').sort(() => Math.random() - 0.5).join('');

        return pass;
    }
}

