import { Injectable, EventEmitter } from '@angular/core';
import { AmplifyService } from 'aws-amplify-angular';
import { Observable } from 'rxjs/Observable';
import { AuthState } from 'aws-amplify-angular/dist/src/providers/auth.state';
import { BackendService } from './backend.service';
import { BehaviorSubject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { FuseNavigationService } from '@fuse/components/navigation/navigation.service';
import { ToastService } from 'app/oc/services/toast.service';

import { FuseTranslationLoaderService } from '@fuse/services/translation-loader.service';
import { ConsoleLoggerService } from './console_logger.service';
import { UserInfo } from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class GoogleAPIService {

  constructor(
    private _backendService: BackendService,
    private _toastService: ToastService,
    private _console: ConsoleLoggerService
  ) {    
  }

  public getDistance(origin: string, destination: string, inputEvent: any){
    let _this = this;
    return _this._backendService.getDistance(origin, destination).subscribe(
      response => {
        // console.log(response);
        if (response.result === 'OK') {
          const distance = response.data.rows[0].elements[0].distance.value;
        }
        else {
          _this._toastService.showErrorToast(response.data);
        }

      },
      error => {
        console.log(error);
        _this._toastService.showErrorToast(error);        
      });
  }
}
