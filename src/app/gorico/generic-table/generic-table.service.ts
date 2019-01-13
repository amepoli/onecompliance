import { Injectable } from '@angular/core';
import { AmplifyService } from 'aws-amplify-angular';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class GenericTableService {

  private apiName = 'gorico';
  private myGetInit = { // OPTIONAL
        headers: {
        }, // OPTIONAL
        response: true, // OPTIONAL (return the entire Axios response object instead of only response.data)
        queryStringParameters: {  // OPTIONAL
           codice_part: 'DEMO', 
           id: '' 
        }
  };

  private myPutPostInit = { // OPTIONAL
    body: {
    },
    headers: {
    }, // OPTIONAL
    queryStringParameters: {  // OPTIONAL
       codice_part: 'DEMO' 
    }
};

  indexArray: number[];
  currentIndex: number;

  constructor(private amplifyService: AmplifyService) { 
  }

  getData(path: string, codice_part: string, id: string): Observable<any> {
    this.amplifyService.auth();

    this.myGetInit.queryStringParameters.codice_part = codice_part;
    this.myGetInit.queryStringParameters.id = id;

    return from(this.amplifyService.api().get(this.apiName, path, this.myGetInit))
           .pipe(map(res => res['data']));
  }

  pushData(path: string, codice_part: string, jsonData: any): Observable<any> { 
    this.amplifyService.auth();
    this.myPutPostInit.queryStringParameters.codice_part = codice_part;
    this.myPutPostInit.body = jsonData;

    return from(this.amplifyService.api().put(this.apiName, path, this.myPutPostInit));
  }

  deleteData(path: string, codice_part: string, id: string): Observable<any> {
    this.amplifyService.auth();
    this.myGetInit.queryStringParameters.codice_part = codice_part;
    this.myGetInit.queryStringParameters.id = id;
    return from(this.amplifyService.api().del(this.apiName, path, this.myGetInit));
  }

  updateData(path: string, codice_part: string, jsonData: any): Observable<any> { 
    this.amplifyService.auth();
    this.myPutPostInit.queryStringParameters.codice_part = codice_part;
    this.myPutPostInit.body = jsonData;
    return from(this.amplifyService.api().post(this.apiName, path, this.myPutPostInit));
  }
}
