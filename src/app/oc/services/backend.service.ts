import { Injectable } from '@angular/core';
import { AmplifyService } from 'aws-amplify-angular';
import { Observable, from } from 'rxjs';
import { FormActionType } from '../types';
import axios from 'axios';
import { environment } from 'environments/environment';

const appData = (environment.appData as any).default;
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
  private timeTrackerApiName = appData.lambdas.time_tracker.apiName;
  private archiflowApiName = appData.lambdas.archiflow.apiName;
  private googleApiName = appData.lambdas.google_api.apiName;

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
    axios.interceptors.request.use((config) => {
        config.timeout = 120000;
        return config;
      }, (error) => {
        return Promise.reject(error);
      });
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

  performFormAction(formActionType: FormActionType,  entryName: string, company: string, keys: any): Observable<any> {
    this.amplifyService.auth();
    this.myGetInit.queryStringParameters = { entry_name: entryName, isFormAction: 1, formActionType: formActionType, company: company, keys: JSON.stringify(keys) };
    return from(this.amplifyService.api().get(this.apiName, '/' + this.tablesApiName, this.myGetInit));
  }

  updateData(entryName: string, company: string, keys: any, data: any): Observable<any> {
    this.amplifyService.auth();
    this.myPutPostInit.queryStringParameters = { entry_name: entryName, company: company, form: 1, keys: JSON.stringify(keys) };
    this.myPutPostInit.body = JSON.parse(JSON.stringify(data, this.replacer));
    return from(this.amplifyService.api().post(this.apiName, '/' + this.tablesApiName, this.myPutPostInit));
  }

  runCustomQuery(entryName: string, company: string, keys: any, buttonKey: string): Observable<any> {
    this.amplifyService.auth();
    this.myPutPostInit.queryStringParameters = { entry_name: entryName, company: company, keys: JSON.stringify({}), custom_query: 1, custom_query_key: buttonKey};
    this.myPutPostInit.body = keys;
    return from(this.amplifyService.api().post(this.apiName, '/' + this.tablesApiName, this.myPutPostInit));
  }
  
  runTableMultiSelectionActionQuery(entryName: string, company: string, selection_params: any): Observable<any> {
    this.amplifyService.auth();
    this.myPutPostInit.queryStringParameters = { entry_name: entryName, company: company, table_multi_selection_action_query: 1};
    this.myPutPostInit.body = selection_params;
    return from(this.amplifyService.api().post(this.apiName, '/' + this.tablesApiName, this.myPutPostInit));
  }
  
  runCompanyChangeQuery(company: string): Observable<any> {
    this.amplifyService.auth();
    this.myGetInit.queryStringParameters = { company_change_query: 1, company: company};
    return from(this.amplifyService.api().get(this.apiName, '/' + this.tablesApiName, this.myGetInit));
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

  loadFileDataIfExists(entryName: string, company: string, keys: any, checksum: string, md5Checksum: string): Observable<any> {
    this.amplifyService.auth();
    this.myPutPostInit.queryStringParameters = { entry_name: entryName, company: company, request_type: 'loadFileDataIfExists', keys: JSON.stringify(keys), checksum: checksum, md5_checksum: md5Checksum };
    return from(this.amplifyService.api().post(this.apiName, '/' + this.attachApiName, this.myPutPostInit));
  }

  createFileURL(entryName: string, company: string, keys: any): Observable<any> {
    this.amplifyService.auth();
    this.myPutPostInit.queryStringParameters = { entry_name: entryName, company: company, keys: JSON.stringify(keys) };
    return from(this.amplifyService.api().post(this.apiName, '/' + this.attachApiName, this.myPutPostInit));
  }

  checkFile(entryName: string, company: string, keys: any, checksum: string, md5Checksum: string, filename: string, data: any): Observable<any> {
    this.amplifyService.auth();
    this.myPutPostInit.queryStringParameters = { entry_name: entryName, company: company, keys: JSON.stringify(keys), filename: filename, checksum: checksum, md5_checksum: md5Checksum};
    this.myPutPostInit.body = data;
    return from(this.amplifyService.api().post(this.apiName, '/' + this.attachApiName, this.myPutPostInit));
  }

  deleteFile(entryName: string, company: string, id_risorsa: string, filename: string,prog_revisione: string, keys: any): Observable<any> {
    this.amplifyService.auth();
    this.myGetInit.queryStringParameters = { entry_name: entryName, company: company, id_risorsa: id_risorsa, filename: filename,prog_revisione: prog_revisione, keys: JSON.stringify(keys) };
    return from(this.amplifyService.api().del(this.apiName, '/' + this.attachApiName, this.myGetInit));
  }

  getGoogleDriveFileCopyParams(company: string, checksum: string): Observable<any> {
    this.amplifyService.auth();
    this.myGetInit.queryStringParameters = { request_type: 'getGoogleDriveFileCopyParams', company: company, checksum: checksum };
    return from(this.amplifyService.api().get(this.apiName, '/' + this.attachApiName, this.myGetInit));
  }

  getS3GoogleSyncFilesList(company: string): Observable<any> {
    this.amplifyService.auth();
    this.myGetInit.queryStringParameters = { request_type: 'getS3GoogleSyncFilesList', company: company };
    return from(this.amplifyService.api().get(this.apiName, '/' + this.attachApiName, this.myGetInit));
  }

  getContents(entryName: string, company: string, keys: any, contentsPrefix: string): Observable<any> {
    this.amplifyService.auth();
    this.myGetInit.queryStringParameters = { entry_name: entryName, company: company, keys: JSON.stringify(keys), request_type: 'getContents', contents_prefix: contentsPrefix  };
    return from(this.amplifyService.api().get(this.apiName, '/' + this.attachApiName, this.myGetInit));
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
    this.myPutPostInit.body = {};
    this.myPutPostInit.queryStringParameters = { request_type: 'createNewFile' };
    return from(this.amplifyService.api().post(this.apiName, '/' + this.importApiName, this.myPutPostInit));
  }

  importFileFromS3(company: string, fileName: string, entryName: string, columns: string): Observable<any> {
    this.amplifyService.auth();

    // Test data:
    // this.myPutPostInit.queryStringParameters = { request_type: 'importFile', company: 'DEMO', filename: 's3test.csv', table: 'entrasp.s3_import', columns: null };

    this.myPutPostInit.queryStringParameters = { request_type: 'importFile', company: company, filename: fileName, entry_name: entryName, columns: columns };
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

  getCSV(entryName: string, company: string, keys: any, search_keys: any, is_form: boolean, is_advanced: boolean, formValues: any, advanced_query_label: string = null): Observable<any> {
    this.amplifyService.auth();

    this.myPutPostInit.queryStringParameters = { entry_name: entryName, request_type: 'getCSV', company: company, keys: JSON.stringify(keys), is_form: is_form ? 1 : 0, is_csv: 1, is_advanced: is_advanced ? 1 : 0, advanced_query_label: advanced_query_label };
    if (search_keys != null) {
      this.myPutPostInit.queryStringParameters['search_keys'] = JSON.stringify(search_keys);
    }
    this.myPutPostInit.body = JSON.parse(JSON.stringify(formValues, this.replacer));
    return from(this.amplifyService.api().post(this.apiName, '/' + this.importApiName, this.myPutPostInit));
  }

  getExcel(entryName: string, company: string, keys: any, search_keys: any, is_form: boolean, is_advanced: boolean, formValues: any, advanced_query_label: string = null): Observable<any> {
    this.amplifyService.auth();

    this.myPutPostInit.queryStringParameters = { entry_name: entryName, request_type: 'getCSV', company: company, keys: JSON.stringify(keys), is_form: is_form ? 1 : 0, is_csv: 0, is_advanced: is_advanced ? 1 : 0, advanced_query_label: advanced_query_label };
    if (search_keys != null) {
      this.myPutPostInit.queryStringParameters['search_keys'] = JSON.stringify(search_keys);
    }
    this.myPutPostInit.body = JSON.parse(JSON.stringify(formValues, this.replacer));
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

  sendEmail(subject: string, header: string, query: string, footer: string, company: string, conditionQuery: string, onSuccessQuery: string, sender: string, to: string, cc: string, ccn: string): Observable<any> {
    this.amplifyService.auth();
    this.myPutPostInit.queryStringParameters = {company: company};
    this.myPutPostInit.body = JSON.parse(JSON.stringify({
      sender: sender,
      subject: subject,
      body: {
        header: header,
        query: query,
        footer: footer
      },
      company: company,
      conditionQuery: conditionQuery,
      onSuccessQuery: onSuccessQuery,
      to: {list:to},
      cc: {list:cc},
      ccn: {list:ccn}
    }));
    return from(this.amplifyService.api().post(this.apiName, '/' + this.emailApiName, this.myPutPostInit));
  }

  
  isTrDayComplete(username: string, date_time: string): Observable<any> {
    this.amplifyService.auth();
    this.myGetInit.queryStringParameters = {request_type: 'isTrDayComplete', user_name: username, date_time: date_time };
    return from(this.amplifyService.api().get(this.apiName, '/' + this.timeTrackerApiName, this.myGetInit));
  }

  checkTimerStatus(company: string): Observable<any> {
    this.amplifyService.auth();
    this.myGetInit.queryStringParameters = {request_type: 'checkStatus', company: company };
    return from(this.amplifyService.api().get(this.apiName, '/' + this.timeTrackerApiName, this.myGetInit));
  }

  startTimer(company: string, codice_compito: string): Observable<any> {
    this.amplifyService.auth();
    this.myGetInit.queryStringParameters = { request_type: 'startTime', company: company, codice_compito: codice_compito };
    return from(this.amplifyService.api().get(this.apiName, '/' + this.timeTrackerApiName, this.myGetInit));
  }

  stopTimer(company: string): Observable<any> {
    this.amplifyService.auth();
    this.myGetInit.queryStringParameters = { request_type: 'stopTime', company: company };
    return from(this.amplifyService.api().get(this.apiName, '/' + this.timeTrackerApiName, this.myGetInit));
  }

  updateArchiflow(numRecords: number): Observable<any> {
    this.amplifyService.auth();
    this.myGetInit.queryStringParameters = {numRecords: numRecords};
    return from(this.amplifyService.api().get(this.apiName, '/' + this.archiflowApiName, this.myGetInit));
  }


  saveAuthToken(token_type: string, authCode: any) {
    this.amplifyService.auth();
    this.myPutPostInit.queryStringParameters = { request_type: 'saveAuthToken', token_type: token_type };
    this.myPutPostInit.body = { authCode: authCode };
    return from(this.amplifyService.api().post(this.apiName, '/' + this.googleApiName, this.myPutPostInit));
  }

  loadAuthToken(token_type: string) {
    this.amplifyService.auth();
    this.myGetInit.queryStringParameters = { request_type: 'loadAuthToken', token_type: token_type };
    return from(this.amplifyService.api().get(this.apiName, '/' + this.googleApiName, this.myGetInit));
  }

  getDistance(origin: string, destination: string): Observable<any> {
    this.amplifyService.auth();
    this.myGetInit.queryStringParameters = { request_type: 'GetDistance', origin: origin, destination: destination };
    return from(this.amplifyService.api().get(this.apiName, '/' + this.googleApiName, this.myGetInit));
  }

  getEmailThreads(search: string, authToken: any) {
    this.amplifyService.auth();
    this.myPutPostInit.queryStringParameters = { request_type: 'GetEmailThreads', search: search };
    this.myPutPostInit.body = authToken;
    return from(this.amplifyService.api().post(this.apiName, '/' + this.googleApiName, this.myPutPostInit));
  
    // this.myGetInit.queryStringParameters = { request_type: 'GetEmailThreads' };
    // return from(this.amplifyService.api().get(this.apiName, '/' + this.googleApiName, this.myGetInit));
  
  }

  getDriveContents(folder: string, authToken: any) {
    this.amplifyService.auth();
    this.myPutPostInit.queryStringParameters = { request_type: 'getDriveContents', folder: folder };
    this.myPutPostInit.body = authToken;
    return from(this.amplifyService.api().post(this.apiName, '/' + this.googleApiName, this.myPutPostInit));
  
    // this.myGetInit.queryStringParameters = { request_type: 'GetEmailThreads' };
    // return from(this.amplifyService.api().get(this.apiName, '/' + this.googleApiName, this.myGetInit));
  
  }

  createDriveFolder(folder: string, authToken: any) {
    this.amplifyService.auth();
    this.myPutPostInit.queryStringParameters = { request_type: 'createDriveFolder', folder: folder };
    this.myPutPostInit.body = authToken;
    return from(this.amplifyService.api().post(this.apiName, '/' + this.googleApiName, this.myPutPostInit));
  }

  copyFromS3ToDrive(s3FilePath: string, driveFilePath: string, authToken: any) {
    this.amplifyService.auth();
    this.myPutPostInit.queryStringParameters = { request_type: 'copyFromS3ToDrive', s3FilePath: s3FilePath, driveFilePath: driveFilePath };
    this.myPutPostInit.body = authToken;
    return from(this.amplifyService.api().post(this.apiName, '/' + this.googleApiName, this.myPutPostInit));
  
  }

  copyFromDriveToS3(driveFilePath: string, s3FilePath: string, authToken: any) {
    this.amplifyService.auth();
    this.myPutPostInit.queryStringParameters = { request_type: 'copyFromDriveToS3', driveFilePath: driveFilePath, s3FilePath: s3FilePath };
    this.myPutPostInit.body = authToken;
    return from(this.amplifyService.api().post(this.apiName, '/' + this.googleApiName, this.myPutPostInit));
  }

  syncDriveS3File(syncData: object, authToken: any) {
    this.amplifyService.auth();
    this.myPutPostInit.queryStringParameters = { request_type: 'syncDriveS3File', syncData: JSON.stringify(syncData) };
    this.myPutPostInit.body = authToken;
    return from(this.amplifyService.api().post(this.apiName, '/' + this.googleApiName, this.myPutPostInit));
  }

  fixAnagraficaFolderByIdentifier(anagraficaFolders: any, authToken: any) {
    this.amplifyService.auth();
    this.myPutPostInit.queryStringParameters = { request_type: 'fixAnagraficaFolderByIdentifier' };
    this.myPutPostInit.body = { anagraficaFolders, authToken };
    return from(this.amplifyService.api().post(this.apiName, '/' + this.googleApiName, this.myPutPostInit));
  }

  fixDriveFolderPathByIdentifier(anagraficaFolder: any, authToken: any) {
    this.amplifyService.auth();
    this.myPutPostInit.queryStringParameters = { request_type: 'fixDriveFolderPathByIdentifier' };
    this.myPutPostInit.body = { anagraficaFolder, authToken };
    return from(this.amplifyService.api().post(this.apiName, '/' + this.googleApiName, this.myPutPostInit));
  }

  getDriveFolderDeepContents(anagraficaFolders: any, authToken: any) {
    this.amplifyService.auth();
    this.myPutPostInit.queryStringParameters = { request_type: 'getDriveFolderDeepContents' };
    this.myPutPostInit.body = { anagraficaFolders, authToken };
    return from(this.amplifyService.api().post(this.apiName, '/' + this.googleApiName, this.myPutPostInit));
  }

  processDriveFolderDeepContents(deepContentsRequest: any, authToken: any) {
    this.amplifyService.auth();
    this.myPutPostInit.queryStringParameters = { request_type: 'processDriveFolderDeepContents' };
    this.myPutPostInit.body = { deepContentsRequest, authToken };
    return from(this.amplifyService.api().post(this.apiName, '/' + this.googleApiName, this.myPutPostInit));
  }

  performDriveOperations(operations: any, authToken: any) {
    this.amplifyService.auth();
    this.myPutPostInit.queryStringParameters = { request_type: 'performDriveOperations' };
    this.myPutPostInit.body = { operations, authToken };
    return from(this.amplifyService.api().post(this.apiName, '/' + this.googleApiName, this.myPutPostInit));
  }

  getGoogleDriveFolderNameByAnagrafica(company: string, id_anagrafica: string, username: string): Observable<any> {
    this.amplifyService.auth();
    this.myGetInit.queryStringParameters = { request_type: 'getGoogleDriveFolderNameByAnagrafica', company: company, id_anagrafica: id_anagrafica, username: username };
    return from(this.amplifyService.api().get(this.apiName, '/' + this.attachApiName, this.myGetInit));
  }

  setProperFileFolder(input: any) {
    this.amplifyService.auth();
    this.myPutPostInit.queryStringParameters = { request_type: 'setProperFileFolder' };
    this.myPutPostInit.body = input;
    return from(this.amplifyService.api().post(this.apiName, '/' + this.attachApiName, this.myPutPostInit));
  }

  loadHomePage(entryName: string, company: string): Observable<any> {
    this.amplifyService.auth();
    this.myGetInit.queryStringParameters = { entry_name: entryName, company: company, homepage: 1};
    return from(this.amplifyService.api().get(this.apiName, '/' + this.tablesApiName, this.myGetInit));
  }

  loadHomePageTab(entryName: string, company: string, search_keys: any): Observable<any> {
    this.amplifyService.auth();
    this.myGetInit.queryStringParameters = { entry_name: entryName, company: company, homepagetab: 1};
    if (search_keys != null) {
      this.myGetInit.queryStringParameters['search_keys'] = JSON.stringify(search_keys);
    }
    return from(this.amplifyService.api().get(this.apiName, '/' + this.tablesApiName, this.myGetInit));
  }
  
}
