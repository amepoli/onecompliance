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

  globalTableKeys = {}; // global to all tables
 
constructor(private amplifyService: AmplifyService) { 
}

  getView(entryName: string):  Observable<any> {
    this.amplifyService.auth();
    this.myGetInit.queryStringParameters = {entry_name: entryName};
    return from(this.amplifyService.api().get(this.apiName, '/view', this.myGetInit));
  }

  getData(entryName: string, keys: any, search_keys: any, isForm: boolean, isNew: boolean): Observable<any> {
    this.amplifyService.auth();

    this.myGetInit.queryStringParameters = {entry_name: entryName, keys: JSON.stringify(keys), form: isForm ? 1 : 0, new: isNew ? 1 : 0}; 

    if (search_keys) {
      this.myGetInit.queryStringParameters['search_keys'] = JSON.stringify(search_keys); 
    }

    return from(this.amplifyService.api().get(this.apiName, '/data', this.myGetInit));
  }

  postEvent(entryName: string, field: string, data: any, event: string): Observable<any> {
    this.amplifyService.auth();
    this.myPutPostInit.queryStringParameters = {entry_name: entryName, event: JSON.stringify({name: event, field: field})};
    this.myPutPostInit.body = data; 
    return from(this.amplifyService.api().post(this.apiName, '/data', this.myPutPostInit));
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

  getAttachList(entryName: string, keys: any): Observable<any> {
    this.amplifyService.auth();
    this.myGetInit.queryStringParameters = {entry_name: entryName, keys: JSON.stringify(keys) }; 
    return from(this.amplifyService.api().get(this.apiName, '/attach', this.myGetInit));
  }

  getFileURL(entryName: string, keys: any, filename: string): Observable<any> {
    this.amplifyService.auth();
    this.myGetInit.queryStringParameters = {entry_name: entryName, keys: JSON.stringify(keys), filename: filename}; 
    return from(this.amplifyService.api().get(this.apiName, '/attach', this.myGetInit));
  }

  createFileURL(entryName: string, keys: any): Observable<any> {
    this.amplifyService.auth();
    this.myPutPostInit.queryStringParameters = {entry_name: entryName, keys: JSON.stringify(keys)};
    return from(this.amplifyService.api().post(this.apiName, '/attach', this.myPutPostInit));
  }

  checkFile(entryName: string, keys: any, checksum: string, filename: string, data: any): Observable<any> {
    this.amplifyService.auth();
    this.myPutPostInit.queryStringParameters = {entry_name: entryName, keys: JSON.stringify(keys), filename: filename, checksum: checksum};
    this.myPutPostInit.body = data;
    return from(this.amplifyService.api().post(this.apiName, '/attach', this.myPutPostInit));
  }

  getReportList(entryName: string, keys: any): Observable<any> {
    this.amplifyService.auth();
    this.myGetInit.queryStringParameters = {entry_name: entryName, keys: JSON.stringify(keys), list: '1'};
    return from(this.amplifyService.api().get(this.apiName, '/report', this.myGetInit));
  }

  getReport(entryName: string, keys: any, reportName: string, isFormView: boolean, search_keys: any): Observable<any> {
    this.amplifyService.auth();
    this.myPutPostInit.queryStringParameters = {entry_name: entryName, keys: JSON.stringify(keys), form: isFormView ? 1 : 0 };
    if (search_keys != null) {
        this.myPutPostInit.queryStringParameters['search_keys'] = search_keys; 
    }
    this.myPutPostInit.body = reportName;
    return from(this.amplifyService.api().post(this.apiName, '/report', this.myPutPostInit));
  }
}
