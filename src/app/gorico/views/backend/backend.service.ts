import { Injectable } from '@angular/core';
import { AmplifyService } from 'aws-amplify-angular';
import { Observable, from } from 'rxjs';



@Injectable({
  providedIn: 'root'
})
export class BackendService {

  private apiName = 'gorico'; 
  private myGetInit = { // OPTIONAL
        headers: {
        }, // OPTIONAL
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

  currentTableKeys = {};

  currentFormKeys = {};
 
constructor(private amplifyService: AmplifyService) { 
}

  getView(entryName: string):  Observable<any> {
    this.amplifyService.auth();
    this.myGetInit.queryStringParameters = {entry_name: entryName};
    return from(this.amplifyService.api().get(this.apiName, '/view', this.myGetInit));
  }

  getData(entryName: string, keys: any, isForm: boolean, isNew: boolean): Observable<any> {
    this.amplifyService.auth();

    this.myGetInit.queryStringParameters = {entry_name: entryName, keys: JSON.stringify(keys), form: isForm ? 1: 0, new: isNew ? 1 : 0}; 

    return from(this.amplifyService.api().get(this.apiName, '/data', this.myGetInit));
  }

  deleteData(entryName: string, keys: any): Observable<any> {
    this.amplifyService.auth();
    this.myGetInit.queryStringParameters = {entry_name: entryName, keys: JSON.stringify(keys)};
    return from(this.amplifyService.api().del(this.apiName, '/data', this.myGetInit));
  }

  updateData(entryName: string, keys: any, data: any): Observable<any> { 
    this.amplifyService.auth();
    this.myPutPostInit.queryStringParameters = {entry_name: entryName, keys: JSON.stringify(keys)};
    this.myPutPostInit.body = data;
    return from(this.amplifyService.api().post(this.apiName, '/data', this.myPutPostInit));
  }

  getAttachList(tableName: string, primaryKeyValues: any, company: string) {
    this.amplifyService.auth();
    this.myGetInit.queryStringParameters = {table: tableName, keys: JSON.stringify(primaryKeyValues), codice_azienda: company }; 
    return from(this.amplifyService.api().get(this.apiName, '/attach', this.myGetInit));
  }

  
}
