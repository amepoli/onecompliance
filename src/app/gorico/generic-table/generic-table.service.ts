import { Injectable } from '@angular/core';
import { AmplifyService } from 'aws-amplify-angular';
import { Observable, from, BehaviorSubject } from 'rxjs';
import { FieldConfig } from '../dynamic-forms/field.interface';
import { Validators } from '@angular/forms';


export type operationType = 'list' | 'sublist' | 'create' | 'select' | 'search' | 'keys' | 'subkeys' | 'attach';


@Injectable({
  providedIn: 'root'
})
export class GenericTableService {

  private apiName = 'gorico'; 
  private myGetInit = { // OPTIONAL
        headers: {
        }, // OPTIONAL
        // response: true, // OPTIONAL (return the entire Axios response object instead of only response.data)
        queryStringParameters: {  // OPTIONAL
        }
  };

  private myPutPostInit = { // OPTIONAL
    body: {
    },
    headers: {
    }, // OPTIONAL
    queryStringParameters: {  // OPTIONAL
    }
};


  keysArray: any[] = []; // contains an array of all primary keys (one for each row) of current list
  currentIndex: number = 0;  // this is the index of currently selected row in the parent list (single record view)
  tableParams: any;  // this is the set of table params of current list 
  fullTable: any; // this is the current full list

  currentPath: string; // current main table's path

  private fullScreen: BehaviorSubject<boolean>; // trigger full view of sublist in single record view 

  constructor(private amplifyService: AmplifyService) { 
      this.fullScreen = new BehaviorSubject<boolean>(false);
  }

  public isFullScreen(): Observable<boolean> {
    return this.fullScreen.asObservable();
  }
  
  public setFullScreen(newValue: boolean): void {
    this.fullScreen.next(newValue);
  }

  public getFullScreen(): boolean {
      return this.fullScreen.getValue();
  }

  getData(tableName: string, primaryKeyValues: any, operation: operationType): Observable<any> {
    this.amplifyService.auth();

    this.myGetInit.queryStringParameters = {tablename: tableName, keys: JSON.stringify(primaryKeyValues), operation: operation}; 

    return from(this.amplifyService.api().get(this.apiName, '/table', this.myGetInit));
        //   .pipe(map(res => res['data']));
  }

  pushData(tableName: string, primaryKeyValues: any, jsonData: any): Observable<any> { 
    this.amplifyService.auth();
    this.myPutPostInit.queryStringParameters = {tablename: tableName, keys: JSON.stringify(primaryKeyValues)};;
    this.myPutPostInit.body = jsonData;

    return from(this.amplifyService.api().put(this.apiName, '/table', this.myPutPostInit));
  }

  deleteData(tableName: string, primaryKeyValues: any): Observable<any> {
    this.amplifyService.auth();
    this.myGetInit.queryStringParameters = {tablename: tableName, keys: JSON.stringify(primaryKeyValues)};
    return from(this.amplifyService.api().del(this.apiName, '/table', this.myGetInit));
  }

  updateData(tableName: string, primaryKeyValues: any, jsonData: any): Observable<any> { 
    this.amplifyService.auth();
    this.myPutPostInit.queryStringParameters = {tablename: tableName, keys: JSON.stringify(primaryKeyValues)};
    this.myPutPostInit.body = jsonData;
    return from(this.amplifyService.api().post(this.apiName, '/table', this.myPutPostInit));
  }
 
  searchData(tableName: string, primaryKeyValues: any, jsonData: any): Observable<any> { 
    this.amplifyService.auth();
    this.myPutPostInit.queryStringParameters = {tablename: tableName, keys: JSON.stringify(primaryKeyValues), operation: 'search'};
    this.myPutPostInit.body = jsonData;
    return from(this.amplifyService.api().post(this.apiName, '/table', this.myPutPostInit));
  }

  // helper functions 

    process_form(input_form: FieldConfig[]): void { // pre-process form got from back-end

        let sameLineElements: FieldConfig[] = [];
        for (let result of input_form) {
            if (result['validations']) {
                for (const validator of result['validations']) {
                    if (validator['name'] === 'required') {
                        validator['validator'] = Validators.required;
                    }
                    if (validator['name'] === 'pattern') {
                        validator['validator'] = Validators.pattern(validator['validator']);
                    }
                }
            }
            if (result['newLine'] === false) {
                sameLineElements.push(result);
            } else {
                result.width = this.processInlineElements(sameLineElements);
                sameLineElements = [];
            }
        }
        this.processInlineElements(sameLineElements); // handles inline elements of last line
    }

    private processInlineElements(elements: FieldConfig[]): number {

        const numElements = 1 + elements.length; // current + previouses
        let sumWidths = 0;
        if (elements.length) { // some elements to put on the same line
            const singleWidth = Math.floor(100 / numElements);
            for (let element of elements) {
                element.width = singleWidth - 10; // considering 10% margins;
                sumWidths += singleWidth;
            }
        }
        return (100 - 10 - sumWidths); // considering 10% margins
    }

    prepare_form(value: any, form: FieldConfig[]) { // prepare fields for postgresql query
        const form_keys = form.map(c => c.name);
        // tslint:disable-next-line:forin
        for (const key in value) {
            const item = form[form_keys.indexOf(key)];
            switch (item.type) {
                case 'input': {
                    if (value[key]['value']) { // sublist primary key
                        value[key] = value[key]['value'];
                    }
                    if (item.inputType === 'text') {
                        if (value[key] !== '' && value[key] !== 'null') {
                            value[key] = '\'' + value[key].replace(/'/g, "''") + '\''; // format the string for postgresql
                        } else {
                            value[key] = 'null';
                        }
                    } else { // number
                        if (value[key] === '') {
                            value[key] = 'null';
                        }
                    }
                    break;
                }
                case 'combobox': {
                    if (value[key] !== '' && value[key] !== 'null') {
                        value[key] = value[key].id;
                        if (item.inputType === 'multiple') {
                            const combo_keys = item.keys.map(c => c.name);
                            const combo_types = item.keys.map(c => c.inputType);
                            const input_values = value[key].split('££');  // array with multiple keys
                            const output_values = {};
                            input_values.forEach(element => {
                                const combo_key = combo_keys.shift();
                                const combo_type = combo_types.shift();
                                if (combo_type === 'text') {
                                    element = '\'' + element + '\'';
                                }
                                output_values[combo_key] = element;
                            });
                            value[key] = output_values;
                        } else if (item.inputType === 'text') {
                            value[key] = '\'' + value[key] + '\'';
                        }
                    } else {
                        if (item.inputType === 'multiple') {
                            const output_values = {};
                            item.keys.forEach(element => {
                                output_values[element.name] = 'null';
                            });
                            value[key] = output_values;
                        } else {
                            value[key] = 'null';
                        }
                    }
                    break;
                }
                case 'checkbox': {
                    value[key] = value[key] ? '1' : '0';
                    break;
                }
                case 'textarea': {
                    if (value[key] !== '' && value[key] !== 'null') {
                        value[key] = '\'' + value[key].replace(/'/g, "''") + '\''; // format the string for postgresql
                    } else {
                        value[key] = 'null';
                    }
                }
            }
        }
    }

    scrollToBottom(): void {
        const mainEl = document.getElementById('container-3'); // in the hierarchy, this is the element scrolling
        mainEl.scrollTop = mainEl.scrollHeight; // scroll to bottom
    }

}
