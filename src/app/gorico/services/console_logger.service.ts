import { Injectable } from '@angular/core';
import * as appData from '../../../../appdata.json';

export interface ILoggerService {
    info(value: any, ...rest: any[]): void;
    log(value: any, ...rest: any[]): void;
    warn(value: any, ...rest: any[]): void;
    error(value: any, ...rest: any[]): void;
    table(value: any, ...rest: any[]): void;
}

@Injectable({
    providedIn: 'root'
})

export class ConsoleLoggerService implements ILoggerService {

    environment = appData.environment;
    
    // set to true if you want to remove all console logs.
    disableAllLogs = false;

    info(value: any, ...rest: any[]): void {
        if (this.environment !== 'production' && !this.disableAllLogs)
            console.info(value, rest);
    }

    log(value: any, ...rest: any[]): void {
        if (this.environment !== 'production' && !this.disableAllLogs)
            console.log(value, rest);
    }

    warn(value: any, ...rest: any[]): void {
        if (this.environment !== 'production' && !this.disableAllLogs)
            console.warn(value, rest);
    }

    error(value: any, ...rest: any[]): void {
        if (this.environment !== 'production' && !this.disableAllLogs)
            console.error(value, rest);
    }

    table(value: any, ...rest: any[]): void {
        if (this.environment !== 'production' && !this.disableAllLogs)
            console.table(value, rest);
    }
}