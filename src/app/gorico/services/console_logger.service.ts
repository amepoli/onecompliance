import { Injectable } from '@angular/core';
import { default as appData } from '../../../../appData.json';

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

    info(value: any, ...rest: any[]): void {
        if (this.environment !== 'production')
            console.info(value, rest);
    }

    log(value: any, ...rest: any[]): void {
        if (this.environment !== 'production')
            console.log(value, rest);
    }

    warn(value: any, ...rest: any[]): void {
        if (this.environment !== 'production')
            console.warn(value, rest);
    }

    error(value: any, ...rest: any[]): void {
        if (this.environment !== 'production')
            console.error(value, rest);
    }

    table(value: any, ...rest: any[]): void {
        if (this.environment !== 'production')
            console.table(value, rest);
    }
}