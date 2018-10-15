import { Injectable } from '@angular/core';
import { AmplifyService } from 'aws-amplify-angular';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private signedIn = false;
  private username: string;
  private password: string;
  errorMessage: string;
  user: any;

  constructor(
      public amplifyService: AmplifyService) 
      { 
          this.amplifyService = amplifyService;

          this.amplifyService.auth(); 

          this.amplifyService.authStateChange$
          .subscribe(authState => {
            this.signedIn = authState.state === 'signedIn';
            
            if (!authState.user) {
                this.user = null;
            } else {
                this.user = authState.user;
            }
            console.log(this.signedIn, this.user);
        });
      }


    public setUsername(username: string) {
        this.username = username;
    }
    
    public setPassword(password: string) {
        this.password = password;
    }  
    
    public isSignedIn(): boolean 
    {
        return this.signedIn;
    }

  /** signin */
  public signIn() 
  {
    this.amplifyService.auth().signIn(this.username, this.password)
    .then(user => {
      if (user['challengeName'] === 'SMS_MFA' || user['challengeName'] === 'SOFTWARE_TOKEN_MFA') {
        this.amplifyService.setAuthState({ state: 'confirmSignIn', user: user });
      } else if (user['challengeName'] === 'NEW_PASSWORD_REQUIRED') {
        this.amplifyService.setAuthState({ state: 'requireNewPassword', user: user });
      } else {
        this.amplifyService.setAuthState({ state: 'signedIn', user: user });
      }
    })
    .catch((err) => {
      this._setError(err);
    });
  }

  public signOut() 
  {
    this.amplifyService.auth().signOut();
  }

  _setError(err) {
    if (!err) {
      this.errorMessage = null;
      return;
    }

    this.errorMessage = err.message || err;
  }
}
