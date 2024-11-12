import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { FormActionType } from '../types';
import axios from 'axios';
import { environment } from 'environments/environment';
import { AwsService } from './aws.service';
import { GetRequest, PostRequest } from '../interfaces';

const appData = (environment.appData as any).default; //appData contains gorico_dev.json or gorico_prod.json
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
  private authApiName = appData.lambdas.auth.apiName;
  private menuApiName = appData.lambdas.menu.apiName;
  private langApiName = appData.lambdas.translation.apiName;
  private emailApiName = appData.lambdas.email_trigger.apiName;
  private timeTrackerApiName = appData.lambdas.time_tracker.apiName;
  private archiflowApiName = appData.lambdas.archiflow.apiName;
  private googleApiName = appData.lambdas.google_api.apiName;
  private regulatApiName = appData.lambdas.regulat.apiName;
  private regulatVPCApiName = appData.lambdas.regulat_VPC.apiName;
  private calendarApiName = appData.lambdas.calendar.apiName;
  private insert_user_to_dynamoApiName = appData.lambdas.insert_user_to_dynamo.apiName;
  private fattureincloudApiName = appData.lambdas.fatture_in_cloud.apiName;

  // private myGetInit = { // OPTIONAL
  //   headers: {
  //   }, // OPTIONAL
  //   queryStringParameters: {  // OPTIONAL
  //   }
  // };

  // private myPutPostInit = { // OPTIONAL
  //   body: {
  //   },
  //   headers: {
  //   }, // OPTIONAL
  //   queryStringParameters: {  // OPTIONAL
  //   }
  // };

  dashboardKeys = null; // bridge keys between dashboard view and main table view

  constructor(private awsService: AwsService) {
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
    this.awsService.auth();
    const getReq: GetRequest = {
      queryStringParameters: { entry_name: entryName, company: company, keys: JSON.stringify(keys) }
    }
    return from(this.awsService.api().get(this.apiName, this.viewsApiName, getReq));
  }

  getProfileData(company: string): Observable<any> {
    this.awsService.auth();
    const getReq: GetRequest = {
      queryStringParameters: { entry_name: '', company: company, get_profile_data_only: 1 }
    }
    return from(this.awsService.api().get(this.apiName, this.tablesApiName, getReq));
  }

  getData(entryName: string, company: string, keys: any, search_keys: any, isForm: boolean, isNew: boolean, dashboardIndex: number, isExcel: boolean): Observable<any> {
    this.awsService.auth();

    const getReq: GetRequest = {
      queryStringParameters: { entry_name: entryName, company: company, keys: JSON.stringify(keys), form: isForm ? 1 : 0, new: isNew ? 1 : 0, excel: isExcel ? 1 : 0 }
    }

    if (dashboardIndex != null) {
      getReq.queryStringParameters['dashboard_index'] = dashboardIndex;
    }

    if (search_keys != null) {
      getReq.queryStringParameters['search_keys'] = JSON.stringify(search_keys);
    }

    return from(this.awsService.api().get(this.apiName, this.tablesApiName, getReq));
  }

  postEvent(entryName: string, company: string, keys: any, field: string, data: any, event: string, actionType: string, isMessage: boolean = false): Observable<any> {
    this.awsService.auth();
    const putPostReq: PostRequest = {
      body: data,
      headers: {},
      queryStringParameters: { entry_name: entryName, company: company, keys: JSON.stringify(keys), event: JSON.stringify({ name: event, type: actionType, field: field, isMessage: isMessage }) }
    };

    return from(this.awsService.api().post(this.apiName, this.tablesApiName, putPostReq));
  }

  deleteData(entryName: string, company: string, keys: any): Observable<any> {
    this.awsService.auth();
    const getReq: GetRequest = {
      queryStringParameters: { entry_name: entryName, company: company, keys: JSON.stringify(keys) }
    }
    return from(this.awsService.api().del(this.apiName, this.tablesApiName, getReq));
  }

  performFormAction(formActionType: FormActionType, entryName: string, company: string, keys: any): Observable<any> {
    this.awsService.auth();
    const getReq: GetRequest = {
      queryStringParameters: { entry_name: entryName, isFormAction: 1, formActionType: formActionType, company: company, keys: JSON.stringify(keys) }
    }
    return from(this.awsService.api().get(this.apiName, this.tablesApiName, getReq));
  }

  updateData(entryName: string, company: string, keys: any, data: any): Observable<any> {
    this.awsService.auth();
    const putPostReq: PostRequest = {

      body: JSON.parse(JSON.stringify(data, this.replacer)),
      headers: {},
      queryStringParameters: { entry_name: entryName, company: company, form: 1, keys: JSON.stringify(keys) }
    };

    return from(this.awsService.api().post(this.apiName, this.tablesApiName, putPostReq));
  }

  runCustomQuery(entryName: string, company: string, keys: any, buttonKey: string): Observable<any> {
    this.awsService.auth();
    const putPostReq: PostRequest = {

      body: keys,
      headers: {},
      queryStringParameters: { entry_name: entryName, company: company, keys: JSON.stringify({}), custom_query: 1, custom_query_key: buttonKey }
    };
    return from(this.awsService.api().post(this.apiName, this.tablesApiName, putPostReq));
  }

  runTableMultiSelectionActionQuery(entryName: string, company: string, selection_params: any): Observable<any> {
    this.awsService.auth();
    const putPostReq: PostRequest = {

      body: selection_params,
      headers: {},
      queryStringParameters: { entry_name: entryName, company: company, table_multi_selection_action_query: 1 },
    };
    return from(this.awsService.api().post(this.apiName, this.tablesApiName, putPostReq));
  }

  runCompanyChangeQuery(company: string): Observable<any> {
    this.awsService.auth();
    const getReq: GetRequest = {
      queryStringParameters: { company_change_query: 1, company: company }
    }
    return from(this.awsService.api().get(this.apiName, this.tablesApiName, getReq));
  }

  getDomandeRisposte(company: string, entryName: string, keys: object): Observable<any> {
    this.awsService.auth();
    const getReq: GetRequest = {
      queryStringParameters: { entry_name: entryName, company: company, keys: JSON.stringify(keys), is_domande_risposte_get_request: 1 }
    }
    return from(this.awsService.api().get(this.apiName, this.tablesApiName, getReq));
  }
  
  updateDomandeRisposte(company: string, entryName: string, keys: object, data: any): Observable<any> {
    this.awsService.auth();    
    const putPostReq: PostRequest = {
      body: {data: data},
      headers: {},
      queryStringParameters: { entry_name: entryName, company: company, keys: JSON.stringify(keys), is_domande_risposte_update_request: 1 }
    };
    return from(this.awsService.api().post(this.apiName, this.tablesApiName, putPostReq));
  }

  getAttachList(entryName: string, company: string, keys: any, businessObjectName: string): Observable<any> {
    this.awsService.auth();
    const getReq: GetRequest = {
      queryStringParameters: { entry_name: entryName, company: company, keys: JSON.stringify(keys), businessObjectName: businessObjectName }
    }
    return from(this.awsService.api().get(this.apiName, this.attachApiName, getReq));
  }

  getFileURL(entryName: string, company: string, keys: any, filename: string): Observable<any> {
    this.awsService.auth();
    const getReq: GetRequest = {
      queryStringParameters: { entry_name: entryName, company: company, keys: JSON.stringify(keys), filename: filename }
    }
    return from(this.awsService.api().get(this.apiName, this.attachApiName, getReq));
  }

  loadFileDataIfExists(entryName: string, company: string, keys: any, checksum: string, md5Checksum: string): Observable<any> {
    this.awsService.auth();
    const putPostReq: PostRequest = {
      body: null,
      headers: {},
      queryStringParameters: { entry_name: entryName, company: company, request_type: 'loadFileDataIfExists', keys: JSON.stringify(keys), checksum: checksum, md5_checksum: md5Checksum }
    };
    return from(this.awsService.api().post(this.apiName, this.attachApiName, putPostReq));
  }

  createFileURL(entryName: string, company: string, keys: any): Observable<any> {

    this.awsService.auth();
    const putPostReq: PostRequest = {
      body: null,
      headers: {},
      queryStringParameters: { entry_name: entryName, company: company, keys: JSON.stringify(keys) }
    };
    return from(this.awsService.api().post(this.apiName, this.attachApiName, putPostReq));
  }

  checkFile(entryName: string, company: string, keys: any, checksum: string, md5Checksum: string, filename: string, data: any): Observable<any> {
    this.awsService.auth();
    const putPostReq: PostRequest = {

      queryStringParameters: { entry_name: entryName, company: company, keys: JSON.stringify(keys), filename: filename, checksum: checksum, md5_checksum: md5Checksum },
      body: data,
      headers: {},
    };
    return from(this.awsService.api().post(this.apiName, this.attachApiName, putPostReq));
  }

  deleteFile(entryName: string, company: string, id_risorsa: string, filename: string, prog_revisione: string, keys: any): Observable<any> {
    this.awsService.auth();
    const getReq: GetRequest = {
      queryStringParameters: { entry_name: entryName, company: company, id_risorsa: id_risorsa, filename: filename, prog_revisione: prog_revisione, keys: JSON.stringify(keys) }
    }
    return from(this.awsService.api().del(this.apiName, this.attachApiName, getReq));
  }

  getGoogleDriveFileCopyParams(company: string, checksum: string): Observable<any> {
    this.awsService.auth();
    const getReq: GetRequest = {
      queryStringParameters: { request_type: 'getGoogleDriveFileCopyParams', company: company, checksum: checksum }
    }
    return from(this.awsService.api().get(this.apiName, this.attachApiName, getReq));
  }

  getS3GoogleSyncFilesList(company: string): Observable<any> {
    this.awsService.auth();
    const getReq: GetRequest = {
      queryStringParameters: { request_type: 'getS3GoogleSyncFilesList', company: company }
    }
    return from(this.awsService.api().get(this.apiName, this.attachApiName, getReq));
  }

  getContents(entryName: string, company: string, keys: any, contentsPrefix: string): Observable<any> {
    this.awsService.auth();
    const getReq: GetRequest = {
      queryStringParameters: { entry_name: entryName, company: company, keys: JSON.stringify(keys), request_type: 'getContents', contents_prefix: contentsPrefix }
    }
    return from(this.awsService.api().get(this.apiName, this.attachApiName, getReq));
  }

  getReportList(entryName: string, company: string, keys: any, isFormView: boolean): Observable<any> {
    this.awsService.auth();
    const getReq: GetRequest = {
      queryStringParameters: { entry_name: entryName, company: company, keys: JSON.stringify(keys), list: '1', form: isFormView ? 1 : 0 }
    }
    return from(this.awsService.api().get(this.apiName, this.reportsApiName, getReq));
  }

  getReport(entryName: string, company: string, keys: any, reportName: string, isFormView: boolean, search_keys: any): Observable<any> {
    this.awsService.auth();
    const putPostReq: PostRequest = {

      body: reportName,
      headers: {},
      queryStringParameters: { entry_name: entryName, company: company, keys: JSON.stringify(keys), form: isFormView ? 1 : 0 },
    };
    if (search_keys != null) {
      putPostReq.queryStringParameters['search_keys'] = JSON.stringify(search_keys);
    }
    return from(this.awsService.api().post(this.apiName, this.reportsApiName, putPostReq));
  }

  getUserData(): Observable<any> {
    this.awsService.auth();
    const getReq: GetRequest = {
      queryStringParameters: {}
    }
    return from(this.awsService.api().get(this.apiName, this.usersApiName, getReq));
  }


  enableMFA(): Observable<any> {
    this.awsService.auth();
    const getReq: GetRequest = {
      queryStringParameters: { mfa_enable: 1 }
    }
    return from(this.awsService.api().get(this.apiName, this.usersApiName, getReq));
  }

  disableMFA(): Observable<any> {
    this.awsService.auth();
    const getReq: GetRequest = {
      queryStringParameters: { mfa_disable: 1 }
    }
    return from(this.awsService.api().get(this.apiName, this.usersApiName, getReq));
  }

  setupTotp(accessToken: string): Observable<any> {
    this.awsService.auth();
    const putPostReq: PostRequest = {

      headers: {},
      queryStringParameters: { setup_totp: 1 },
      body: {
        accessToken
      },
    };
    return from(this.awsService.api().post(this.apiName, this.usersApiName, putPostReq));
  }

  verifyTotp(accessToken: string, totp: string): Observable<any> {
    this.awsService.auth();
    const putPostReq: PostRequest = {

      headers: {},
      queryStringParameters: { verify_totp: 1 },
      body: {
        totp,
        accessToken
      },
    };
    return from(this.awsService.api().post(this.apiName, this.usersApiName, putPostReq));
  }

  signIn(username: string, password: string): Observable<any> {
    const putPostReq: PostRequest = {
      headers: {},
      queryStringParameters: { signin: 1 },
      body: {
        username,
        password
      },
    };
    return from(this.awsService.api().post(this.apiName, this.authApiName, putPostReq));
  }

  confirmSignIn(username: string, session: any, challenge: string, challengeName: string): Observable<any> {
    const putPostReq: PostRequest = {
      headers: {},
      queryStringParameters: { confirm_signin: 1 },
      body: {
        username,
        session,
        challenge,
        challengeName
      },
    };
    return from(this.awsService.api().post(this.apiName, this.authApiName, putPostReq));
  }

  signUp(username: string, password: string, email: string): Observable<any> {
    const putPostReq: PostRequest = {
      headers: {},
      queryStringParameters: { signup: 1 },
      body: {
        username,
        password,
        email
      },
    };
    return from(this.awsService.api().post(this.apiName, this.authApiName, putPostReq));
  }

  confirmSignUp(username: string, code: string): Observable<any> {
    const putPostReq: PostRequest = {
      headers: {},
      queryStringParameters: { confirm_signup: 1 },
      body: {
        username,
        code
      },
    };
    return from(this.awsService.api().post(this.apiName, this.authApiName, putPostReq));
  }

  changePassword(username: string, session: any, newPassword: string, challengeName: string): Observable<any> {
    const putPostReq: PostRequest = {
      headers: {},
      queryStringParameters: { change_password: 1 },
      body: {
        username,
        session,
        newPassword,
        challengeName
      },
    };
    return from(this.awsService.api().post(this.apiName, this.authApiName, putPostReq));
  }

  forgotPassword(username: string): Observable<any> {
    const putPostReq: PostRequest = {
      headers: {},
      queryStringParameters: { forgot_password: 1 },
      body: {
        username,
      },
    };
    return from(this.awsService.api().post(this.apiName, this.authApiName, putPostReq));
  }

  confirmForgotPassword(username: string, code: string, newPassword: string): Observable<any> {
    const putPostReq: PostRequest = {
      headers: {},
      queryStringParameters: { confirm_forgot_password: 1 },
      body: {
        username,
        newPassword,
        code
      },
    };
    return from(this.awsService.api().post(this.apiName, this.authApiName, putPostReq));
  }

  inviteUser(username: string, company: string, associated_user: string, registry: string, tax_code: string, temporaryPassword: string, profile: string) {
    this.awsService.auth();
    const putPostReq: PostRequest = {
      body: null,
      headers: {},
      queryStringParameters: { invite_user: 1, username: username, company: company, associated_user: associated_user, registry: registry, tax_code: tax_code, temporary_password: temporaryPassword, profile: profile },
    };
    return from(this.awsService.api().post(this.apiName, this.usersApiName, putPostReq));
  }

  inviteUserAgain(email: string, temporaryPassword: string) {
    this.awsService.auth();
    const putPostReq: PostRequest = {
      body: null,
      headers: {},
      queryStringParameters: { invite_user_again: 1, email: email, temporary_password: temporaryPassword },
    };
    return from(this.awsService.api().post(this.apiName, this.usersApiName, putPostReq));
  }

  deleteUser(username: string) {
    this.awsService.auth();
    const putPostReq: PostRequest = {
      body: null,
      headers: {},
      queryStringParameters: { delete_user: 1, username: username },
    };
    return from(this.awsService.api().del(this.apiName, this.usersApiName, putPostReq));
  }

  enableCompanyToUser(username: string, companyPart: string, enableCompany: string, office: string, profile: string, associated_user: string, registry: string) {
    this.awsService.auth();
    const putPostReq: PostRequest = {
      body: null,
      headers: {},
      queryStringParameters: { request_type: 'enableCompanyToUser', username: username, companyPart: companyPart, enableCompany: enableCompany, office: office, profile: profile, associated_user: associated_user, registry: registry },
    };
    return from(this.awsService.api().post(this.apiName, this.insert_user_to_dynamoApiName, putPostReq));
  }

  dissociatesCompanyFromUser(username: string, dissociatesCompany: string) {
    this.awsService.auth();
    const putPostReq: PostRequest = {
      body: null,
      headers: {},
      queryStringParameters: { request_type: 'dissociatesCompanyFromUser', username: username, dissociatesCompany: dissociatesCompany },
    };
    return from(this.awsService.api().post(this.apiName, this.insert_user_to_dynamoApiName, putPostReq));
  }

  getMenu(keys: any): Observable<any> {
    this.awsService.auth();
    const getReq: GetRequest = {
      queryStringParameters: { keys: JSON.stringify(keys) }
    }
    return from(this.awsService.api().get(this.apiName, this.menuApiName, getReq));
  }

  getLanguage(lang: string): Observable<any> {
    this.awsService.auth();
    const getReq: GetRequest = {
      queryStringParameters: { lang: lang }
    }
    return from(this.awsService.api().get(this.apiName, this.langApiName, getReq));
  }

  /* Import Related functions */
  createImportFileURL(): Observable<any> {
    this.awsService.auth();
    const putPostReq: PostRequest = {

      headers: {},
      body: {},
      queryStringParameters: { request_type: 'createNewFile' },
    };
    return from(this.awsService.api().post(this.apiName, this.importApiName, putPostReq));
  }

  importFileFromS3(company: string, fileName: string, entryName: string, columns: string, fileType: string = 'CSV'): Observable<any> {
    this.awsService.auth();

    // Test data:
    // queryStringParameters: { request_type: 'importFile', company: 'DEMO', filename: 's3test.csv', table: 'entrasp.s3_import', columns: null };
    const putPostReq: PostRequest = {
      body: null,
      headers: {},
      queryStringParameters: { request_type: 'importFile', company: company, filename: fileName, entry_name: entryName, columns: columns, file_type: fileType }
    };
    return from(this.awsService.api().post(this.apiName, this.importApiName, putPostReq));
  }

  importAdvancedFileFromS3(entryName: string, company: string, keys: any, fileName: string, is_form: boolean, advanced_query_label: string = null): Observable<any> {
    this.awsService.auth();

    // Test data:
    // queryStringParameters: { request_type: 'importFile', company: 'DEMO', queryString: '', filename: 's3test.csv', table: 'entrasp.s3_import', columns: null };

    const putPostReq: PostRequest = {
      body: null,
      headers: {},
      queryStringParameters: { entry_name: entryName, request_type: 'importAdvancedFile', company: company, keys: JSON.stringify(keys), filename: fileName, is_form: is_form ? 1 : 0, advanced_query_label: advanced_query_label }
    };
    return from(this.awsService.api().post(this.apiName, this.importApiName, putPostReq));
  }

  deleteImportFileURL(fileName: string): Observable<any> {
    this.awsService.auth();
    const putPostReq: PostRequest = {
      body: null,
      headers: {},
      queryStringParameters: { request_type: 'deleteFile', filename: fileName }
    };
    return from(this.awsService.api().post(this.apiName, this.importApiName, putPostReq));
  }

  downloadTemplate(entryName: string): Observable<any> {
    this.awsService.auth();
    const putPostReq: PostRequest = {
      body: null,
      headers: {},
      queryStringParameters: { request_type: 'downloadTemplate', entry_name: entryName }
    };
    return from(this.awsService.api().post(this.apiName, this.importApiName, putPostReq));
  }

  getCSV(entryName: string, company: string, keys: any, search_keys: any, is_form: boolean, is_advanced: boolean, formValues: any, advanced_query_label: string = null): Observable<any> {
    this.awsService.auth();
    const putPostReq: PostRequest = {

      headers: {},
      queryStringParameters: { entry_name: entryName, request_type: 'getCSV', company: company, keys: JSON.stringify(keys), is_form: is_form ? 1 : 0, is_csv: 1, is_advanced: is_advanced ? 1 : 0, advanced_query_label: advanced_query_label },
      body: JSON.parse(JSON.stringify(formValues, this.replacer))
    };
    if (search_keys != null) {
      putPostReq.queryStringParameters['search_keys'] = JSON.stringify(search_keys);
    }
    putPostReq.body
    return from(this.awsService.api().post(this.apiName, this.importApiName, putPostReq));
  }

  getExcel(entryName: string, company: string, keys: any, search_keys: any, is_form: boolean, is_advanced: boolean, formValues: any, advanced_query_label: string = null): Observable<any> {
    this.awsService.auth();
    const putPostReq: PostRequest = {

      headers: {},
      queryStringParameters: { entry_name: entryName, request_type: 'getCSV', company: company, keys: JSON.stringify(keys), is_form: is_form ? 1 : 0, is_csv: 0, is_advanced: is_advanced ? 1 : 0, advanced_query_label: advanced_query_label },
      body: JSON.parse(JSON.stringify(formValues, this.replacer))
    };
    if (search_keys != null) {
      putPostReq.queryStringParameters['search_keys'] = JSON.stringify(search_keys);
    }
    return from(this.awsService.api().post(this.apiName, this.importApiName, putPostReq));
  }

  importS3ToRDS(table: string): Observable<any> {
    this.awsService.auth();
    // Test data:
    // queryStringParameters: { request_type: 'importS3ToRDS', table: 'entrasp.s3_import' };

    const putPostReq: PostRequest = {
      body: null,
      headers: {},
      queryStringParameters: { request_type: 'importS3ToRDS', table: table }
    };
    return from(this.awsService.api().post(this.apiName, '/S3ToRDS', putPostReq));
  }

  sendEmailUsingTemplate(templateKey: string): Observable<any> {
    this.awsService.auth();
    const putPostReq: PostRequest = {
      body: null,
      headers: {},
      queryStringParameters: { templateKey: templateKey }
    };
    return from(this.awsService.api().get(this.apiName, this.emailApiName, putPostReq));
  }


  sendEmail(subject: string, header: string, footer: string, company: string, sender: string, to: string, cc: string, ccn: string): Observable<any> {
    this.awsService.auth();
    const putPostReq: PostRequest = {

      headers: {},
      queryStringParameters: { company: company },
      body: JSON.parse(JSON.stringify({
        sender: sender,
        subject: subject,
        body: {
          header: header,
          footer: footer
        },
        company: company,
        to: { list: to },
        cc: { list: cc },
        ccn: { list: ccn }
      }))
    };
    return from(this.awsService.api().post(this.apiName, this.emailApiName, putPostReq));
  }


  isTrDayComplete(username: string, date_time: string): Observable<any> {
    this.awsService.auth();
    const getReq: GetRequest = {
      queryStringParameters: { request_type: 'isTrDayComplete', user_name: username, date_time: date_time }
    }
    return from(this.awsService.api().get(this.apiName, this.timeTrackerApiName, getReq));
  }

  checkTimerStatus(company: string): Observable<any> {
    this.awsService.auth();
    const getReq: GetRequest = {
      queryStringParameters: { request_type: 'checkStatus', company: company }
    }
    return from(this.awsService.api().get(this.apiName, this.timeTrackerApiName, getReq));
  }

  startTimer(company: string, codice_compito: string): Observable<any> {
    this.awsService.auth();
    const getReq: GetRequest = {
      queryStringParameters: { request_type: 'startTime', company: company, codice_compito: codice_compito }
    }
    return from(this.awsService.api().get(this.apiName, this.timeTrackerApiName, getReq));
  }

  stopTimer(company: string): Observable<any> {
    this.awsService.auth();
    const getReq: GetRequest = {
      queryStringParameters: { request_type: 'stopTime', company: company }
    }
    return from(this.awsService.api().get(this.apiName, this.timeTrackerApiName, getReq));
  }

  updateArchiflow(numRecords: number): Observable<any> {
    this.awsService.auth();
    const getReq: GetRequest = {
      queryStringParameters: { numRecords: numRecords }
    }
    return from(this.awsService.api().get(this.apiName, this.archiflowApiName, getReq));
  }


  saveAuthToken(token_type: string, authCode: any) {
    this.awsService.auth();
    const putPostReq: PostRequest = {

      headers: {},
      queryStringParameters: { request_type: 'saveAuthToken', token_type: token_type },
      body: { authCode: authCode }
    };
    return from(this.awsService.api().post(this.apiName, this.googleApiName, putPostReq));
  }

  loadAuthToken(token_type: string) {
    this.awsService.auth();
    const getReq: GetRequest = {
      queryStringParameters: { request_type: 'loadAuthToken', token_type: token_type }
    }
    return from(this.awsService.api().get(this.apiName, this.googleApiName, getReq));
  }

  getDistance(origin: string, destination: string): Observable<any> {
    this.awsService.auth();
    const getReq: GetRequest = {
      queryStringParameters: { request_type: 'GetDistance', origin: origin, destination: destination }
    }
    return from(this.awsService.api().get(this.apiName, this.googleApiName, getReq));
  }

  getEmailThreads(search: string, authToken: any) {
    this.awsService.auth();
    const putPostReq: PostRequest = {

      headers: {},
      queryStringParameters: { request_type: 'GetEmailThreads', search: search },
      body: authToken,
    };
    return from(this.awsService.api().post(this.apiName, this.googleApiName, putPostReq));

    // queryStringParameters: { request_type: 'GetEmailThreads' };
    // return from(this.amplifyService.api().get(this.apiName, this.googleApiName, getReq));

  }

  getEmailsByCodiceAzienda(authToken, codiceAzienda) {
    this.awsService.auth();
    const putPostReq: PostRequest = {

      headers: {},
      queryStringParameters: { request_type: 'getEmailsByCodiceAzienda' },
      body: { codiceAzienda, authToken }
    };
    return from(this.awsService.api().post(this.apiName, this.googleApiName, putPostReq));

  }

  loadChangesToken(authToken: any, changes_type: string) {
    this.awsService.auth();
    const getReq: GetRequest = {
      queryStringParameters: { request_type: 'loadChangesToken', changes_type: changes_type }
    }
    return from(this.awsService.api().get(this.apiName, this.googleApiName, getReq));
  }

  createChangesToken(authToken: any) {
    this.awsService.auth();
    const putPostReq: PostRequest = {

      headers: {},
      queryStringParameters: { request_type: 'createChangesToken' },
      body: authToken
    };
    return from(this.awsService.api().post(this.apiName, this.googleApiName, putPostReq));
  }

  getChanges(authToken: any) {
    this.awsService.auth();
    const putPostReq: PostRequest = {

      headers: {},
      queryStringParameters: { request_type: 'getChanges' },
      body: { authToken }
    };
    return from(this.awsService.api().post(this.apiName, this.googleApiName, putPostReq));
  }

  getDriveContents(folder: string, authToken: any) {
    this.awsService.auth();
    const putPostReq: PostRequest = {

      headers: {},
      queryStringParameters: { request_type: 'getDriveContents', folder: folder },
      body: { authToken }
    };
    return from(this.awsService.api().post(this.apiName, this.googleApiName, putPostReq));

    // queryStringParameters: { request_type: 'GetEmailThreads' };
    // return from(this.amplifyService.api().get(this.apiName, this.googleApiName, getReq));

  }

  createDriveFolder(folder: string, authToken: any) {
    this.awsService.auth();
    const putPostReq: PostRequest = {

      headers: {},
      queryStringParameters: { request_type: 'createDriveFolder', folder: folder },
      body: authToken
    };
    return from(this.awsService.api().post(this.apiName, this.googleApiName, putPostReq));
  }

  copyFromS3ToDrive(s3FilePath: string, driveFilePath: string, authToken: any) {
    this.awsService.auth();
    const putPostReq: PostRequest = {

      headers: {},
      queryStringParameters: { request_type: 'copyFromS3ToDrive', s3FilePath: s3FilePath, driveFilePath: driveFilePath },
      body: authToken
    };
    return from(this.awsService.api().post(this.apiName, this.googleApiName, putPostReq));

  }

  copyFromDriveToS3(driveFilePath: string, s3FilePath: string, authToken: any) {
    this.awsService.auth();
    const putPostReq: PostRequest = {

      headers: {},
      queryStringParameters: { request_type: 'copyFromDriveToS3', driveFilePath: driveFilePath, s3FilePath: s3FilePath },
      body: authToken
    };
    return from(this.awsService.api().post(this.apiName, this.googleApiName, putPostReq));
  }

  syncDriveS3File(syncData: object, syncMode: string, authToken: any) {
    this.awsService.auth();
    const putPostReq: PostRequest = {

      headers: {},
      queryStringParameters: { request_type: 'syncDriveS3File', syncData: JSON.stringify(syncData), syncMode: syncMode },
      body: authToken,
    };
    return from(this.awsService.api().post(this.apiName, this.googleApiName, putPostReq));
  }

  fixAnagraficaFolderByIdentifier(anagraficaFolders: any, authToken: any) {
    this.awsService.auth();
    const putPostReq: PostRequest = {

      headers: {},
      queryStringParameters: { request_type: 'fixAnagraficaFolderByIdentifier' },
      body: { anagraficaFolders, authToken }
    };
    return from(this.awsService.api().post(this.apiName, this.googleApiName, putPostReq));
  }

  fixDriveFolderPathByIdentifier(anagraficaFolder: any, authToken: any) {
    this.awsService.auth();
    const putPostReq: PostRequest = {

      headers: {},
      queryStringParameters: { request_type: 'fixDriveFolderPathByIdentifier' },
      body: { anagraficaFolder, authToken }
    };
    return from(this.awsService.api().post(this.apiName, this.googleApiName, putPostReq));
  }

  getDriveFolderDeepContents(anagraficaFolders: any, authToken: any) {
    this.awsService.auth();
    const putPostReq: PostRequest = {

      headers: {},
      queryStringParameters: { request_type: 'getDriveFolderDeepContents' },
      body: { anagraficaFolders, authToken }
    };
    return from(this.awsService.api().post(this.apiName, this.googleApiName, putPostReq));
  }

  processDriveFolderDeepContents(deepContentsRequest: any, authToken: any) {
    this.awsService.auth();
    const putPostReq: PostRequest = {

      headers: {},
      queryStringParameters: { request_type: 'processDriveFolderDeepContents' },
      body: { deepContentsRequest, authToken }
    };
    return from(this.awsService.api().post(this.apiName, this.googleApiName, putPostReq));
  }

  performDriveOperations(operations: any, authToken: any) {
    this.awsService.auth();
    const putPostReq: PostRequest = {

      headers: {},
      queryStringParameters: { request_type: 'performDriveOperations' },
      body: { operations, authToken }
    };
    return from(this.awsService.api().post(this.apiName, this.googleApiName, putPostReq));
  }

  getGoogleDriveFolderNameByAnagrafica(company: string, id_anagrafica: string, username: string, id_risorsa: string, id_sondaggio: string, codice_part: string): Observable<any> {
    this.awsService.auth();
    const getReq: GetRequest = {
      queryStringParameters: { request_type: 'getGoogleDriveFolderNameByAnagrafica', company: company, id_anagrafica: id_anagrafica, username: username, id_risorsa: id_risorsa, id_sondaggio: id_sondaggio, codice_part: codice_part }
    }
    return from(this.awsService.api().get(this.apiName, this.attachApiName, getReq));
  }

  setProperFileFolder(input: any) {
    this.awsService.auth();
    const putPostReq: PostRequest = {

      headers: {},
      queryStringParameters: { request_type: 'setProperFileFolder' },
      body: input
    };
    return from(this.awsService.api().post(this.apiName, this.attachApiName, putPostReq));
  }

  anagraficheToBeUpdated(input: any) {
    this.awsService.auth();
    const putPostReq: PostRequest = {

      headers: {},
      queryStringParameters: { request_type: 'anagraficheToBeUpdated' },
      body: input
    };
    return from(this.awsService.api().post(this.apiName, this.attachApiName, putPostReq));
  }

  associateEmails(input: any, codiceAzienda) {
    this.awsService.auth();
    const putPostReq: PostRequest = {

      headers: {},
      queryStringParameters: { request_type: 'associateEmails' },
      body: { input, codiceAzienda }
    };
    return from(this.awsService.api().post(this.apiName, this.attachApiName, putPostReq));
  }

  getConnectedRegistries(company: string, registry: string): Observable<any> {
    this.awsService.auth();
    const getReq: GetRequest = {
      queryStringParameters: { request_type: 'getConnectedRegistries', company: company, registry: registry }
    }
    return from(this.awsService.api().get(this.apiName, this.regulatVPCApiName, getReq));
  }

  getConnectedRegistriesFromCheck(company: string, check: string): Observable<any> {
    this.awsService.auth();
    const getReq: GetRequest = {
      queryStringParameters: { request_type: 'getConnectedRegistriesFromCheck', company: company, check: check }
    }
    return from(this.awsService.api().get(this.apiName, this.regulatVPCApiName, getReq));
  }

  getConnectedChecks(company: string, survey: string): Observable<any> {
    this.awsService.auth();
    const getReq: GetRequest = {
      queryStringParameters: { request_type: 'getConnectedChecks', company: company, survey: survey }
    }
    return from(this.awsService.api().get(this.apiName, this.regulatVPCApiName, getReq));
  }

  getAmlScan(company: string, connected_registries: any, checkId: string, dynamoUser: string, isLightScan: boolean): Observable<any> {
    this.awsService.auth();
    const getReq: GetRequest = {
      queryStringParameters: { company: company, connected_registries: JSON.stringify(connected_registries), checkId: checkId, dynamoUser: dynamoUser, isLightScan: isLightScan }
    }
    return from(this.awsService.api().get(this.apiName, this.regulatApiName, getReq));
  }


  createFattureInCloudInvoice(company: string, entity: any) {
    this.awsService.auth();
    const postReq: PostRequest = {
      queryStringParameters: { company },
      body: {
        action: 'createInvoice',
        entity
      }
    }
    return from(this.awsService.api().post(this.apiName, this.fattureincloudApiName, postReq));
  }

  checkFattureInCloudInvoice(entryName: string, company: any) {
    this.awsService.auth();
    const postReq: PostRequest = {
      queryStringParameters: { company },
      body: {
        action: 'checkInvoice',
        entryName
      }
    }
    return from(this.awsService.api().post(this.apiName, this.fattureincloudApiName, postReq));
  }

  loadHomePage(entryName: string, company: string): Observable<any> {
    this.awsService.auth();
    const getReq: GetRequest = {
      queryStringParameters: { entry_name: entryName, company: company, homepage: 1 }
    }
    return from(this.awsService.api().get(this.apiName, this.tablesApiName, getReq));
  }

  loadHomePageTab(entryName: string, company: string, search_keys: any): Observable<any> {
    this.awsService.auth();
    const getReq: GetRequest = {
      queryStringParameters: { entry_name: entryName, company: company, homepagetab: 1 }
    }
    if (search_keys != null) {
      getReq.queryStringParameters['search_keys'] = JSON.stringify(search_keys);
    }
    return from(this.awsService.api().get(this.apiName, this.tablesApiName, getReq));
  }

  getCalendarEvents(company: string): Observable<any> {
    this.awsService.auth();
    const getReq: GetRequest = {
      queryStringParameters: { company: company }
    }
    return from(this.awsService.api().get(this.apiName, this.calendarApiName, getReq));
  }

  getSearchKeys(entryName: string, company: string, keys: any): Observable<any> {
    this.awsService.auth();
    const getReq: GetRequest = {
      queryStringParameters: { entry_name: entryName, company: company, keys: JSON.stringify(keys), isSearchKeyRequest: 1 }
    }
    return from(this.awsService.api().get(this.apiName, this.viewsApiName, getReq));
  }

}
