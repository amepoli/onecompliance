import { Injectable } from '@angular/core';
import * as appData from '../../../../appdata.json';
import { ILoggerService } from '../interfaces';

@Injectable({
    providedIn: 'root'
})
export class DataSharingService {

    private dataDictionary: any = {};

    public setData(key: string, data: any) {
        this.dataDictionary[key] = data;
    }

    public getData(key: string) {
        return this.dataDictionary[key];
    }

    public clearData(key: string) {
        this.dataDictionary[key] = null;
    }
}