import { Injectable } from '@angular/core';
import { AmplifyService } from 'aws-amplify-angular';
import { Observable } from 'rxjs/Observable';
import { AuthState } from 'aws-amplify-angular/dist/src/providers/auth.state';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private username: string;
  private password: string;
  private email: string;
  errorMessage: string;
  authStateChange$: Observable<AuthState>;
  isSignedIn = false;

  constructor(
      public amplifyService: AmplifyService) 
      { 
          this.amplifyService = amplifyService;

          this.amplifyService.auth(); 

          this.authStateChange$ = this.amplifyService.authStateChange$;

      }

    public setUsername(username: string): void {
        this.username = username;
    }
    
    public setPassword(password: string): void {
        this.password = password;
    }  

    public setEmail(email: string): void {
      this.email = email;
    }
    

  /** signin */
  public signIn(): void
  {
    this.amplifyService.auth().signIn(this.username, this.password)
    .then(user => {
      this.isSignedIn = false;
      if (user['challengeName'] === 'SMS_MFA' || user['challengeName'] === 'SOFTWARE_TOKEN_MFA') {
        this.amplifyService.setAuthState({ state: 'confirmSignIn', user: user });
      } else if (user['challengeName'] === 'NEW_PASSWORD_REQUIRED') {
        this.amplifyService.setAuthState({ state: 'requireNewPassword', user: user });
      } else {
        this.amplifyService.setAuthState({ state: 'signedIn', user: user });
        this.isSignedIn = true; 
      }
    })
    .catch((err) => {
      this._setError(err);
    });
  }

  public signOut(): void 
  {
    this.isSignedIn = false;
    this.amplifyService.auth().signOut();
  }

  public signUp(): void 
  {
    this.amplifyService.auth().signUp(this.username,
      this.password,
      this.email)
    .then(user => this.amplifyService.setAuthState({ state: 'confirmSignUp', user: { 'username': this.username } }))
    .catch(err => this._setError(err));
  }

  _setError(err): void 
    {
    if (!err) {
      this.errorMessage = null;
      return;
    }

    this.errorMessage = err.message || err;
  }
}
