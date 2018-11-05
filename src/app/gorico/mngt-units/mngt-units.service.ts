import { Injectable } from '@angular/core';
import { AmplifyService } from 'aws-amplify-angular';
import { Observable, from } from 'rxjs';
import { MngtUnit } from './mngt-units.model';
import { map } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class MngtUnitsService {

  private apiName = 'gorico';
  private path = '/management-units'; 
  private myInit = { // OPTIONAL
        headers: {
        }, // OPTIONAL
        response: true, // OPTIONAL (return the entire Axios response object instead of only response.data)
        queryStringParameters: {  // OPTIONAL
           codice_part: 'DEMO' // TODO: parametric, depending on user 
        }
  };

  constructor(private amplifyService: AmplifyService) { 
  }

  getData(): Observable<MngtUnit[]> {
    this.amplifyService.auth();

    return from(this.amplifyService.api().get(this.apiName, this.path, this.myInit))
           .pipe(map(res => res['data']));
  }
}

