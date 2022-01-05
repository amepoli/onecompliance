import { Injectable } from '@angular/core';

import { ILoggerService } from '../interfaces';

import { environment } from 'environments/environment';
@Injectable({
    providedIn: 'root'
})

export class ConsoleLoggerService implements ILoggerService {
    
    // set to true if you want to remove all console logs.
    disableAllLogs = false;

    info(value: any, ...rest: any[]): void {
        if (!environment.production && !this.disableAllLogs)
            console.info(value, rest);
    }

    log(value: any, ...rest: any[]): void {
        if (!environment.production && !this.disableAllLogs)
            console.log(value, rest);
    }

    warn(value: any, ...rest: any[]): void {
        if (!environment.production && !this.disableAllLogs)
            console.warn(value, rest);
    }

    error(value: any, ...rest: any[]): void {
        if (!environment.production && !this.disableAllLogs)
            console.error(value, rest);
    }

    table(value: any, ...rest: any[]): void {
        if (!environment.production && !this.disableAllLogs)
            console.table(value, rest);
    }
}