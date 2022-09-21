import { Injectable, EventEmitter } from '@angular/core';
import { AmplifyService } from 'aws-amplify-angular';
import { Observable } from 'rxjs/Observable';
import { AuthState } from 'aws-amplify-angular/dist/src/providers/auth.state';
import { BackendService } from './backend.service';
import { BehaviorSubject, forkJoin } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { FuseNavigationService } from '@fuse/components/navigation/navigation.service';
import { ToastService } from 'app/oc/services/toast.service';

import { FuseTranslationLoaderService } from '@fuse/services/translation-loader.service';
import { ConsoleLoggerService } from './console_logger.service';
import { UserInfo } from '../interfaces';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class GoogleAPIService {

  constructor(
    private _backendService: BackendService,
    private _toastService: ToastService,
    private _console: ConsoleLoggerService,
    private backendService: BackendService,
    private authService: AuthService
  ) {    
  }

  public getDistance(origin: string, destination: string, inputEvent: any){
    let _this = this;
    return _this._backendService.getDistance(origin, destination).subscribe(
      response => {
        // _this._console.log(response);
        if (response.result === 'OK') {
          const distance = response.data.rows[0].elements[0].distance.value;
        }
        else {
          _this._toastService.showErrorToast(response.data);
        }

      },
      error => {
        _this._console.log(error);
        _this._toastService.showErrorToast(error);        
      });
  }

  public async getEmailsByCodiceAzienda(googleAuth, codiceAzienda) {
    let _this = this;
    
    let getEmailsByCodiceAziendaResponse: any = await _this.backendService.getEmailsByCodiceAzienda(googleAuth, codiceAzienda).toPromise();
    _this._console.log('getEmailsByCodiceAzienda Response: ', getEmailsByCodiceAziendaResponse);
    
    if(getEmailsByCodiceAziendaResponse.result === 'OK') {
      let associateEmailsResponse: any = await _this.backendService.associateEmails(getEmailsByCodiceAziendaResponse.emails, codiceAzienda).toPromise();
      _this._console.log('associateEmails Response: ', associateEmailsResponse);
      return associateEmailsResponse;
    }
    else {
      return getEmailsByCodiceAziendaResponse;
    }
  }

  public async getChanges(googleAuth) {
    let _this = this;
    const changes = await _this.backendService.getChanges(googleAuth).toPromise();
    _this._console.log(changes);

    let anagraficheToBeUpdatedResponse: any = await _this.backendService.anagraficheToBeUpdated(changes).toPromise();
    _this._console.log('anagraficheToBeUpdated Response: ', anagraficheToBeUpdatedResponse);
    
    return anagraficheToBeUpdatedResponse.response.rows;
  }

  public async syncGoogleDrive(googleAuth, codiceAzienda, idAnagrafica, idProgetto, idRisorsa, idSondaggio, codicePart) {

    let _this = this;
    let anagrafica_contents =  await _this.backendService.getGoogleDriveFolderNameByAnagrafica(codiceAzienda, idAnagrafica, _this.authService.getUsername(), idRisorsa, idSondaggio, codicePart ).toPromise();
    _this._console.log(anagrafica_contents);
    if(anagrafica_contents && anagrafica_contents.response && anagrafica_contents.response.length > 0) {
      let anagraficaFolders = anagrafica_contents.response[0]['anagrafica_folder_name_and_sub_folders'];
      //anagraficaFolders['root_folder'] = '0020-Amedeo Poli';
      let sub_folders = anagraficaFolders['sub_folders'];
      if(sub_folders && sub_folders.length > 0) {
          for(let i = 0; i < sub_folders.length; i++) {
              if(sub_folders[i]['folder'].endsWith('/')) {
                  sub_folders[i]['folder'] = sub_folders[i]['folder'].slice(0 , -1);
              }
              if(!sub_folders[i]['folder'].includes('/')) {
                  sub_folders[i]['fileid'] = sub_folders[i]['s3Folder'] + '/' + sub_folders[i]['fileid'];
              }
          }
          //sub_folders = sub_folders.filter(x => !x.md5 || !x.md5.includes('null::varchar'))
      }
  
      anagraficaFolders['sub_folders'] = sub_folders;
      
      _this._console.log(codiceAzienda, idProgetto, idRisorsa, idAnagrafica, anagraficaFolders);
      
      const driveFolder = anagraficaFolders['root_folder'];
      const subFolders = anagraficaFolders['sub_folders'] || [];
  
      let foldersToCheck = [driveFolder];
      if(subFolders && subFolders.length > 0) {
          for await (let subFolder of subFolders) {
              if(!foldersToCheck.includes(subFolder.folder)) {
                  foldersToCheck.push(subFolder.folder);
              }
          }
      }
      
      _this._console.log('foldersToCheck: ', JSON.stringify(foldersToCheck));
      
      anagraficaFolders['folder_ids'] = {};
      for await (let folderToCheck of foldersToCheck) {
          let fixDriveFolderPathByIdentifierResponse = await _this.backendService.fixDriveFolderPathByIdentifier(folderToCheck, googleAuth).toPromise();
          anagraficaFolders['folder_ids'][fixDriveFolderPathByIdentifierResponse['folder']] = fixDriveFolderPathByIdentifierResponse['folderId'];
  
      }
  
      // let fixDriveFolderPathByIdentifierResponse = await forkJoin(foldersToCheck.map(x => _this.backendService.fixDriveFolderPathByIdentifier(x, googleAuth))).toPromise();
      // _this._console.log('fixDriveFolderPathByIdentifier Response: ', fixDriveFolderPathByIdentifierResponse);
      
      // anagraficaFolders['folder_ids'] = {};
      // fixDriveFolderPathByIdentifierResponse.forEach(x => {
      //     anagraficaFolders['folder_ids'][x['folder']] = x['folderId']
      // });
  
      anagraficaFolders['codice_azienda'] = codiceAzienda;
      
      _this._console.log(anagraficaFolders);
      // let fixAnagraficaFolderByIdentifierResponse = await _this.backendService.fixAnagraficaFolderByIdentifier(anagraficaFolders, googleAuth).toPromise();
      // _this._console.log('fixAnagraficaFolderByIdentifier Response ', fixAnagraficaFolderByIdentifierResponse);
      // anagraficaFolders['folder_ids'] = fixAnagraficaFolderByIdentifierResponse['folderIds'];
      // anagraficaFolders['codice_azienda'] = codiceAzienda;
      
      
      let getDriveFolderDeepContentsResponse: any = await _this.backendService.getDriveFolderDeepContents(anagraficaFolders, googleAuth).toPromise();
      _this._console.log('getDriveFolderDeepContentsResponse ',getDriveFolderDeepContentsResponse);
  
      // let syncDataResponse = await forkJoin(getDriveFolderDeepContentsResponse.syncData.map(x => _this.backendService.syncDriveS3File([x], googleAuth))).toPromise();
      let syncDataResponse = [];
      for (const x of getDriveFolderDeepContentsResponse.syncData) {
        let syncDriveS3FileResponse = await _this.backendService.syncDriveS3File([x], googleAuth).toPromise();
        syncDataResponse.push(syncDriveS3FileResponse);
        _this._console.log(syncDriveS3FileResponse);
      };

      _this._console.log('syncDataResponse', syncDataResponse);
  
      anagraficaFolders['root_drive_contents'] = getDriveFolderDeepContentsResponse.rootDriveContents;
      let processDriveFolderDeepContentsResponse: any = await _this.backendService.processDriveFolderDeepContents(anagraficaFolders, googleAuth).toPromise();
      _this._console.log('processDriveFolderDeepContentsResponse ', processDriveFolderDeepContentsResponse);
  
                
      let filteredFilesForSetProperFileFolder = [];
      for(let file of processDriveFolderDeepContentsResponse.files) {
          if(file.fileid.includes('/')) {
              file.fileid = file.fileid.split('/')[1];
          }
          if(filteredFilesForSetProperFileFolder.filter(x => x.fileid == file.fileid && x.filename == file.filename && x.folder == file.folder).length == 0) {
              filteredFilesForSetProperFileFolder.push(file);
          }
      }
  
      let contentsJson = {
          codice_azienda: codiceAzienda,
          id_progetto: idProgetto,
          id_anagrafica: idAnagrafica,
          files: filteredFilesForSetProperFileFolder
      }
      _this._console.log(contentsJson);
  
      let setProperFileFolderResponse: any = await _this.backendService.setProperFileFolder(contentsJson).toPromise();
      _this._console.log('setProperFileFolder Response: ', setProperFileFolderResponse);
      
      
      
      let performDriveOperationsResponse = [];
      if(setProperFileFolderResponse.response && setProperFileFolderResponse.response.rows && setProperFileFolderResponse.response.rows.length > 0) {
          for await (let operation of setProperFileFolderResponse.response.rows) {
              let performDriveOperationResponse = await _this.backendService.performDriveOperations([operation], googleAuth).toPromise();
              performDriveOperationsResponse.push(performDriveOperationResponse);                                    
          }
          // let performDriveOperationsResponse = await forkJoin(setProperFileFolderResponse.response.rows.map(x => _this.backendService.performDriveOperations([x], googleAuth))).toPromise();
      }
      
       _this._console.log('performDriveOperations Response: ', performDriveOperationsResponse);
    }
  }
}
