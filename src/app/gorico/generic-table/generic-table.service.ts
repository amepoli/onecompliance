import { Injectable } from '@angular/core';
import { AmplifyService } from 'aws-amplify-angular';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';

export type operationType = 'list' | 'create' | 'select' | 'search' | 'sublist' ;


@Injectable({
  providedIn: 'root'
})
export class GenericTableService {

  private apiName = 'gorico';
  private myGetInit = { // OPTIONAL
        headers: {
        }, // OPTIONAL
        //response: true, // OPTIONAL (return the entire Axios response object instead of only response.data)
        queryStringParameters: {  // OPTIONAL
           key1: 'DEMO', // codice
           key2: ''      // id
        }
  };

  private myPutPostInit = { // OPTIONAL
    body: {
    },
    headers: {
    }, // OPTIONAL
    queryStringParameters: {  // OPTIONAL
       key1: 'DEMO', // codice
       key2: ''          // id
    }
};


  keysArray: any[] = []; // contains an array of all primary keys (one for each row) of current list
  currentIndex: number = 0;  // this is the index of currently selected row in the parent list (single record view)
  tableParams: any;  // this is the set of table params of current list 

  constructor(private amplifyService: AmplifyService) { 
  }

  getData(path: string, primaryKeyValues: any, operation: operationType): Observable<any> {
    this.amplifyService.auth();

    this.myGetInit.queryStringParameters = primaryKeyValues;

    this.myGetInit.queryStringParameters['operation'] = operation;

    return from(this.amplifyService.api().get(this.apiName, path, this.myGetInit));
        //   .pipe(map(res => res['data']));
  }

  pushData(path: string, primaryKeyValues: any, jsonData: any): Observable<any> { 
    this.amplifyService.auth();
    this.myPutPostInit.queryStringParameters = primaryKeyValues;
    this.myPutPostInit.body = jsonData;

    return from(this.amplifyService.api().put(this.apiName, path, this.myPutPostInit));
  }

  deleteData(path: string, primaryKeyValues: any): Observable<any> {
    this.amplifyService.auth();
    this.myGetInit.queryStringParameters = primaryKeyValues;
    return from(this.amplifyService.api().del(this.apiName, path, this.myGetInit));
  }

  updateData(path: string, primaryKeyValues: any, jsonData: any): Observable<any> { 
    this.amplifyService.auth();
    this.myPutPostInit.queryStringParameters = primaryKeyValues;
    this.myPutPostInit.body = jsonData;
    return from(this.amplifyService.api().post(this.apiName, path, this.myPutPostInit));
  }
}
