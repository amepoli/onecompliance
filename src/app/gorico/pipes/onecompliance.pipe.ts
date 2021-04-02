import { Pipe, PipeTransform } from '@angular/core';
import { formatCurrency, formatDate, formatNumber, formatPercent } from '@angular/common';

@Pipe({name: 'onecompliance'})
export class OneCompliancePipe implements PipeTransform
{
    locales = {
        en: "en-US",
        it: 'it-IT'
    };

    dataTypesList: string[] = [
        "text",
        "date",
        "datetime",
        "time",
        "number",
        "boolean"
    ];

    pipesList: string[] = [
        "Date",
        "DateTime",
        "Time",
        "UpperCase",
        "LowerCase",
        "Currency",
        "Decimal",
        "Percent"
    ];

    /**
     * Transform
     *
     * @param {string} value
     * @param {any} format
     * @returns {string}
     */
    transform(value: string, format: any): string
    {
        if (format && value) {
            if (format.pipe != null) {
                switch (format.pipe) {
                    default: return value;
                    case "Date": return formatDate(value, 'dd/MM/yyyy', this.locales.en);
                    case "DateTime": return formatDate(value, 'dd/MM/yyyy, h:mm:ss a', this.locales.en);
                    case "Time": return formatDate(value, 'h:mm:ss a', this.locales.en);
                    case "UpperCase": return value.toUpperCase();
                    case "LowerCase": return value.toLowerCase();
                    case "Currency": return formatCurrency(parseInt('' + value), this.locales.en, 'Euro', 'EUR');
                    case "Decimal": return formatNumber(parseFloat('' + value), this.locales.en, '1.0.3');
                    case "Percent": return formatPercent(parseFloat('' + value), this.locales.en, '1.0.2');
                }
            }
            else if (format.dataType != null) {
                switch (format.dataType) {
                    case "date": return formatDate(value, 'dd/MM/yyyy', this.locales.en);
                    case "datetime": return formatDate(value, 'dd/MM/yyyy, h:mm:ss a', this.locales.en);
                    case "time": return formatDate(value, 'h:mm:ss a', this.locales.en);
                    default: case "text":  case "number": case "boolean": return value;
                }
            }
        }
        return value;
        
    }
}
