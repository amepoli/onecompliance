import { Injectable } from '@angular/core';
import { AmplifyService } from 'aws-amplify-angular';
import { Observable, from } from 'rxjs';
import { default as appData } from '../../../../../appdata.json';



@Injectable({
  providedIn: 'root'
})
export class BackendService {

  private apiName = appData.apiName;
  private tablesApiName = appData.lambdas.tables.apiName;
  private viewsApiName = appData.lambdas.views.apiName;
  private attachApiName = appData.lambdas.attachments.apiName;
  private reportsApiName = appData.lambdas.reports.apiName;
  private importApiName = appData.lambdas.import.apiName;
  private usersApiName = appData.lambdas.users.apiName;
  private menuApiName = appData.lambdas.menu.apiName;
  private langApiName = appData.lambdas.translation.apiName;
  private emailApiName = appData.lambdas.email_trigger.apiName;

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

  dashboardKeys = null; // bridge keys between dashboard view and main table view

  constructor(private amplifyService: AmplifyService) {
  }

  private replacer(key, value) {
    if (value === undefined) {
      return null;
    }
    return value;
  }

  getView(entryName: string, company: string, keys: any): Observable<any> {
    this.amplifyService.auth();
    this.myGetInit.queryStringParameters = { entry_name: entryName, company: company, keys: JSON.stringify(keys) };
    return from(this.amplifyService.api().get(this.apiName, '/' + this.viewsApiName, this.myGetInit));
  }

  getData(entryName: string, company: string, keys: any, search_keys: any, isForm: boolean, isNew: boolean, dashboardIndex: number, isExcel: boolean): Observable<any> {
    this.amplifyService.auth();

    this.myGetInit.queryStringParameters = { entry_name: entryName, company: company, keys: JSON.stringify(keys), form: isForm ? 1 : 0, new: isNew ? 1 : 0, excel: isExcel ? 1 : 0 };

    if (dashboardIndex != null) {
      this.myGetInit.queryStringParameters['dashboard_index'] = dashboardIndex;
    }

    if (search_keys != null) {
      this.myGetInit.queryStringParameters['search_keys'] = JSON.stringify(search_keys);
    }

    return from(this.amplifyService.api().get(this.apiName, '/' + this.tablesApiName, this.myGetInit));
  }

  postEvent(entryName: string, company: string, keys: any, field: string, data: any, event: string, actionType: string, isMessage: boolean = false): Observable<any> {
    this.amplifyService.auth();
    this.myPutPostInit.queryStringParameters = { entry_name: entryName, company: company, keys: JSON.stringify(keys), event: JSON.stringify({ name: event, type: actionType, field: field, isMessage: isMessage }) };
    this.myPutPostInit.body = data;
    return from(this.amplifyService.api().post(this.apiName, '/' + this.tablesApiName, this.myPutPostInit));
  }

  deleteData(entryName: string, company: string, keys: any): Observable<any> {
    this.amplifyService.auth();
    this.myGetInit.queryStringParameters = { entry_name: entryName, company: company, keys: JSON.stringify(keys) };
    return from(this.amplifyService.api().del(this.apiName, '/' + this.tablesApiName, this.myGetInit));
  }

  updateData(entryName: string, company: string, keys: any, data: any): Observable<any> {
    this.amplifyService.auth();
    this.myPutPostInit.queryStringParameters = { entry_name: entryName, company: company, form: 1, keys: JSON.stringify(keys) };
    this.myPutPostInit.body = JSON.parse(JSON.stringify(data, this.replacer));
    return from(this.amplifyService.api().post(this.apiName, '/' + this.tablesApiName, this.myPutPostInit));
  }

  getAttachList(entryName: string, company: string, keys: any): Observable<any> {
    this.amplifyService.auth();
    this.myGetInit.queryStringParameters = { entry_name: entryName, company: company, keys: JSON.stringify(keys) };
    return from(this.amplifyService.api().get(this.apiName, '/' + this.attachApiName, this.myGetInit));
  }

  getFileURL(entryName: string, company: string, keys: any, filename: string): Observable<any> {
    this.amplifyService.auth();
    this.myGetInit.queryStringParameters = { entry_name: entryName, company: company, keys: JSON.stringify(keys), filename: filename };
    return from(this.amplifyService.api().get(this.apiName, '/' + this.attachApiName, this.myGetInit));
  }

  createFileURL(entryName: string, company: string, keys: any): Observable<any> {
    this.amplifyService.auth();
    this.myPutPostInit.queryStringParameters = { entry_name: entryName, company: company, keys: JSON.stringify(keys) };
    return from(this.amplifyService.api().post(this.apiName, '/' + this.attachApiName, this.myPutPostInit));
  }

  checkFile(entryName: string, company: string, keys: any, checksum: string, filename: string, data: any): Observable<any> {
    this.amplifyService.auth();
    this.myPutPostInit.queryStringParameters = { entry_name: entryName, company: company, keys: JSON.stringify(keys), filename: filename, checksum: checksum };
    this.myPutPostInit.body = data;
    return from(this.amplifyService.api().post(this.apiName, '/' + this.attachApiName, this.myPutPostInit));
  }

  deleteFile(entryName: string, company: string, id_risorsa: string, filename: string, keys: any): Observable<any> {
    this.amplifyService.auth();
    this.myGetInit.queryStringParameters = { entry_name: entryName, company: company, id_risorsa: id_risorsa, filename: filename, keys: JSON.stringify(keys) };
    return from(this.amplifyService.api().del(this.apiName, '/' + this.attachApiName, this.myGetInit));
  }

  getReportList(entryName: string, company: string, keys: any, isFormView: boolean): Observable<any> {
    this.amplifyService.auth();
    this.myGetInit.queryStringParameters = { entry_name: entryName, company: company, keys: JSON.stringify(keys), list: '1', form: isFormView ? 1 : 0 };
    return from(this.amplifyService.api().get(this.apiName, '/' + this.reportsApiName, this.myGetInit));
  }

  getReport(entryName: string, company: string, keys: any, reportName: string, isFormView: boolean, search_keys: any): Observable<any> {
    this.amplifyService.auth();
    this.myPutPostInit.queryStringParameters = { entry_name: entryName, company: company, keys: JSON.stringify(keys), form: isFormView ? 1 : 0 };
    if (search_keys != null) {
      this.myPutPostInit.queryStringParameters['search_keys'] = JSON.stringify(search_keys);
    }
    this.myPutPostInit.body = reportName;
    return from(this.amplifyService.api().post(this.apiName, '/' + this.reportsApiName, this.myPutPostInit));
  }

  getUserData(): Observable<any> {
    this.amplifyService.auth();
    this.myGetInit.queryStringParameters = {};
    return from(this.amplifyService.api().get(this.apiName, '/' + this.usersApiName, this.myGetInit));
  }

  getMenu(keys: any): Observable<any> {
    this.amplifyService.auth();
    this.myGetInit.queryStringParameters = { keys: JSON.stringify(keys) };
    return from(this.amplifyService.api().get(this.apiName, '/' + this.menuApiName, this.myGetInit));
  }

  getLanguage(lang: string): Observable<any> {
    this.amplifyService.auth();
    this.myGetInit.queryStringParameters = { lang: lang };
    return from(this.amplifyService.api().get(this.apiName, '/' + this.langApiName, this.myGetInit));
  }

  /* Import Related functions */
  createImportFileURL(): Observable<any> {
    this.amplifyService.auth();
    this.myPutPostInit.queryStringParameters = { request_type: 'createNewFile' };
    return from(this.amplifyService.api().post(this.apiName, '/' + this.importApiName, this.myPutPostInit));
  }

  importFileFromS3(company: string, fileName: string, table: string, columns: string): Observable<any> {
    this.amplifyService.auth();

    // Test data:
    // this.myPutPostInit.queryStringParameters = { request_type: 'importFile', company: 'DEMO', filename: 's3test.csv', table: 'entrasp.s3_import', columns: null };

    this.myPutPostInit.queryStringParameters = { request_type: 'importFile', company: company, filename: fileName, table: table, columns: columns };
    return from(this.amplifyService.api().post(this.apiName, '/' + this.importApiName, this.myPutPostInit));
  }

  importAdvancedFileFromS3(entryName: string, company: string, keys: any, fileName: string, is_form: boolean, advanced_query_label: string = null): Observable<any> {
    this.amplifyService.auth();

    // Test data:
    // this.myPutPostInit.queryStringParameters = { request_type: 'importFile', company: 'DEMO', queryString: '', filename: 's3test.csv', table: 'entrasp.s3_import', columns: null };

    this.myPutPostInit.queryStringParameters = { entry_name: entryName, request_type: 'importAdvancedFile', company: company, keys: JSON.stringify(keys), filename: fileName, is_form: is_form ? 1 : 0, advanced_query_label: advanced_query_label  };
    return from(this.amplifyService.api().post(this.apiName, '/' + this.importApiName, this.myPutPostInit));
  }

  deleteImportFileURL(fileName: string): Observable<any> {
    this.amplifyService.auth();
    this.myPutPostInit.queryStringParameters = { request_type: 'deleteFile', filename: fileName };
    return from(this.amplifyService.api().post(this.apiName, '/' + this.importApiName, this.myPutPostInit));
  }

  downloadTemplate(entryName: string): Observable<any> {
    this.amplifyService.auth();
    this.myPutPostInit.queryStringParameters = { request_type: 'downloadTemplate', entry_name: entryName };
    return from(this.amplifyService.api().post(this.apiName, '/' + this.importApiName, this.myPutPostInit));
  }

  getCSV(entryName: string, company: string, keys: any, search_keys: any, is_form: boolean, is_advanced: boolean, advanced_query_label: string = null): Observable<any> {
    this.amplifyService.auth();

    this.myPutPostInit.queryStringParameters = { entry_name: entryName, request_type: 'getCSV', company: company, keys: JSON.stringify(keys), is_form: is_form ? 1 : 0, is_csv: 1, is_advanced: is_advanced ? 1 : 0, advanced_query_label: advanced_query_label };
    if (search_keys != null) {
      this.myPutPostInit.queryStringParameters['search_keys'] = JSON.stringify(search_keys);
    }
    return from(this.amplifyService.api().post(this.apiName, '/' + this.importApiName, this.myPutPostInit));
  }

  getExcel(entryName: string, company: string, keys: any, search_keys: any, is_form: boolean, is_advanced: boolean, advanced_query_label: string = null): Observable<any> {
    this.amplifyService.auth();

    this.myPutPostInit.queryStringParameters = { entry_name: entryName, request_type: 'getCSV', company: company, keys: JSON.stringify(keys), is_form: is_form ? 1 : 0, is_csv: 0, is_advanced: is_advanced ? 1 : 0, advanced_query_label: advanced_query_label };
    if (search_keys != null) {
      this.myPutPostInit.queryStringParameters['search_keys'] = JSON.stringify(search_keys);
    }
    return from(this.amplifyService.api().post(this.apiName, '/' + this.importApiName, this.myPutPostInit));
  }

  importS3ToRDS(table: string): Observable<any> {
    this.amplifyService.auth();

    // Test data:
    // this.myPutPostInit.queryStringParameters = { request_type: 'importS3ToRDS', table: 'entrasp.s3_import' };

    this.myPutPostInit.queryStringParameters = { request_type: 'importS3ToRDS', table: table };
    return from(this.amplifyService.api().post(this.apiName, '/S3ToRDS', this.myPutPostInit));
  }

  sendEmailUsingTemplate(templateKey: string): Observable<any> {
    this.amplifyService.auth();
    this.myPutPostInit.queryStringParameters = { templateKey: templateKey };
    return from(this.amplifyService.api().get(this.apiName, '/' + this.emailApiName, this.myPutPostInit));
  }

  sendEmail(subject: string, header: string, query: string, footer: string, company: string, conditionQuery: string, onSuccessQuery: string, to: string, cc: string): Observable<any> {
    this.amplifyService.auth();
    this.myPutPostInit.queryStringParameters = {
      subject: subject,
      body: {
        header: header,
        query: query,
        footer: footer
      },
      company: company,
      conditionQuery: conditionQuery,
      onSuccessQuery: onSuccessQuery,
      to: to,
      cc: cc
    };
    return from(this.amplifyService.api().get(this.apiName, '/' + this.emailApiName, this.myPutPostInit));
  }

}
