import { Injectable } from '@angular/core';
import { AmplifyService } from 'aws-amplify-angular';

@Injectable({
  providedIn: 'root'
})
export class LoginPageService {

  signedIn: Boolean;
  user: any;
  greeting: string;

  constructor(
      public amplifyService: AmplifyService) 
      { 
          this.amplifyService = amplifyService;

          this.amplifyService.authStateChange$
          .subscribe(authState => {
            this.signedIn = authState.state === 'signedIn';
            if (!authState.user) {
                this.user = null;
            } else {
                this.user = authState.user;
                this.greeting = 'Hello ' + this.user.username;
            }
        });
      }
}
