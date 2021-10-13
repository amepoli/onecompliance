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
import { GoogleLoginProvider, SocialAuthService, SocialUser } from 'angularx-social-login';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private username: string;
  private password: string;
  private email: string;
  private code: string;
  errorMessage: string;
  authStateChange$: Observable<AuthState>;
  public isSignedIn = false;

  // backend user data
  public userinfo = new BehaviorSubject<UserInfo>({ name: null, lastname: null, username: null, picture: null, language: 'it', companies: [] });

  // Error Information Event Emitter for catching and emitting
  // Login and Signup related errors.
  public errorInfo$ = new EventEmitter<any>();

  private currentCompany: string;

  // Google 
  googleUser: SocialUser;
  googleUserLoggedIn: boolean;

  constructor(
    private amplifyService: AmplifyService,
    private socialAuthService: SocialAuthService,
    private backendService: BackendService,
    private navigationService: FuseNavigationService,
    private _toastService: ToastService,
    private _fuseTranslationLoaderService: FuseTranslationLoaderService,
    private _translateService: TranslateService,
    private _console: ConsoleLoggerService
  ) {
    this.amplifyService = amplifyService;

    this.amplifyService.auth();

    this.authStateChange$ = this.amplifyService.authStateChange$;

  }

  public setUsername(username: string): void {
    this.username = username;
  }

  public getUsername(): string {
    return this.username;
  }

  public setPassword(password: string): void {
    this.password = password;
  }

  public setEmail(email: string): void {
    this.email = email;
  }

  public setCode(code: string): void {
    this.code = code;
  }

  public getCode(): string {
    return this.code;
  }

  public getEmail(): string {
    return this.email;
  }

  public forgotPassword(username: string): void {
    this.amplifyService.auth().forgotPassword(username)
    .then(data => this._console.log(data))
    .catch((err) => {
      this.errorInfo$.emit(err);
      this._setError(err); });
  }

  public forgotPasswordSubmit(username: string, code: string, new_password: string): void {
    this.amplifyService.auth().forgotPasswordSubmit(username, code, new_password)
    .then(data => this._console.log(data))
    .catch((err) => {
      this.errorInfo$.emit(err);
      this._setError(err); });
  }


  /** signin */
  public signIn(): void {
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
          // now get user and related menu info from backend
          this.retrieveUserInfo();
        }
      })
      .catch((err) => {
        this.errorInfo$.emit(err);
        this._setError(err);
      });
  }

  public signOut(): void {
    this.isSignedIn = false;
    this.currentCompany = null; // force default company for next login
    this.amplifyService.auth().signOut();
    this.userinfo.next({ name: null, lastname: null, username: null, picture: null, language: 'it', companies: [] }); // user data nulled
    // reset the left menu
    this.navigationService.setCurrentNavigation('main');
    this.navigationService.unregister('usermenu');
  }

  public signUp(): void {
    this.amplifyService.auth().signUp(this.username,
      this.password,
      this.email)
      .then(user => this.amplifyService.setAuthState({ state: 'sign-up', user: { 'username': this.username } }))
      .catch(err => {
        this.errorInfo$.emit(err);
        this._setError(err);
      });
  }

  public confirmSignUp(code: string): void {
      this.amplifyService.auth().confirmSignUp(this.username, code)
      .then(data => {
         this.amplifyService.setAuthState({ state: 'confirm-sign-up', user: { 'username': this.username } });
          this._console.log(data);
      })
      .catch(err => {
        this.errorInfo$.emit(err);
        this._setError(err);
      });
  }

  public updateUserInfo(company: string): void {
    const _this = this;
    if (company == null || company === _this.currentCompany) {
      return;
    }
    _this.currentCompany = company;
    // Save company to local storage
    _this.setLastCompany(_this.currentCompany);
    // reset the left menu
    _this.navigationService.setCurrentNavigation('main');
    _this.navigationService.unregister('usermenu');

    //get languages
    _this.retrieveLanguages();

    // get new menu
    _this.retrieveMenu();

  }

  public getCurrentCompany(currentKeys: any = null): string {
    const _this = this;
    if (currentKeys != null && currentKeys.codice_azienda != null) {
        return currentKeys.codice_azienda;
    }
    return _this.currentCompany;
  }

  _setError(err): void {
    if (!err) {
      this.errorMessage = null;
      return;
    }

    this.errorMessage = err.message || err;
  }

  private retrieveUserInfo(): void {
    const _this = this;
    _this.backendService.getUserData().subscribe(
      ud => {
        if (ud != null && ud.result === 'OK') {
          if (ud.userdata.language == null) {
            ud.userdata.language = 'it';  // defaults to italian
          }
          _this.userinfo.next(ud.userdata); // signal a value change to subscribers
          if (_this.currentCompany == null) {  // do not get default company if reloading because of user chose a different company
            // Check if last company is stored in local storage
            let lastCompany: string = _this.getLastCompany();
            if(lastCompany && ud.userdata.companies.includes(lastCompany)){
              // Set last company from local storage
              _this.currentCompany = lastCompany;
            }
            else{
              // Select first compnay from companies list 
              _this.currentCompany = ud.userdata.companies[0];
              // Save company to local storage
              _this.setLastCompany(_this.currentCompany);
            }
          }
          _this._console.log(ud.userdata);

          //load default language for user
          _this._translateService.setDefaultLang(ud.userdata.language);

          //get languages
          _this.retrieveLanguages();

          // get new menu
          _this.retrieveMenu();
        }
        else {
          // Show error snackbar
          _this._toastService.showErrorToast(ud.reason);
          _this.userinfo.next(null);
          _this._console.error(ud);
        }
      });
  }

  private retrieveMenu(): void {
    const _this = this;
    _this.backendService.getMenu({ codice_azienda: _this.currentCompany }).subscribe(
      menu => {
        if (menu != null && menu.result === 'OK') {
          _this.navigationService.register('usermenu', [menu.menu]);
          _this.navigationService.setCurrentNavigation('usermenu');
        }
        else {
          // Show error snackbar
          _this._toastService.showErrorToast(menu.reason);
        }
      });
  }

  private retrieveLanguages(): void {
    const _this = this;
    _this.backendService.getLanguage('it').subscribe(
      result_it => {
        if (result_it.result === 'OK') {
          _this._fuseTranslationLoaderService.loadTranslations(result_it.data);
          _this.backendService.getLanguage('en').subscribe(
            result_en => {
              if (result_en.result === 'OK') {
                _this._fuseTranslationLoaderService.loadTranslations(result_en.data);

                // Use a language
                _this._translateService.use(_this._translateService.getDefaultLang());
              }
              else {
                // Show error snackbar
                _this._toastService.showErrorToast(result_en.reason);
              }
            });
        }
        else {
          // Show error snackbar
          _this._toastService.showErrorToast(result_it.reason);
        }
      });
  }

  /** Check if local storage contains access token */
  public doesAccessTokenExist(): boolean {
    var result = false;
    // Go through all the keys in local storage
    // and check if there's any with accessToken in it
    Array.from(Array(localStorage.length)).forEach((val, i) => {
      if (localStorage.key(i).includes('accessToken')) {
        // Found it!
        result = true;
      }
      // console.log(localStorage.key(i), localStorage.getItem(localStorage.key(i)));
    });
    return result;
  }

  /** Check if local storage contains company */
  public getLastCompany(): string {
    let lastCompany: string = localStorage.getItem('lastCompany');
    console.log('lastCompany', lastCompany);
    return lastCompany;
  }

  /** Set last Company in local storage */
  public setLastCompany(lastCompany: string) {
    localStorage.setItem('lastCompany', lastCompany);
  }

  /** Load Session */
  public loadSession() {
    this.amplifyService.auth().currentUserInfo()
      .then(user => {
        // Check if user is valid
        if (user && user.id) {
          // User is valid
          this.amplifyService.setAuthState({ state: 'signedIn', user: user });
          this.isSignedIn = true;
          // now get user and related menu info from backend
          this.retrieveUserInfo();
        }
        else {
          // User was invalid
          this.errorInfo$.emit("Invalid session!");
        }
      })
      .catch(error => {
        this._console.error(error);

        // Error occured which means the session was invalid or expired
        // Emit the error so we can stop showing the loading dialog
        this.errorInfo$.emit(error);
      }
      );


    /* 
    // Testing auth token stuff
    this.amplifyService.auth().currentCredentials()
      .then(credentials => {
        // let awsPersonalCreds = this.amplifyService.auth().essentialCredentials(credentials);
        // console.table(awsPersonalCreds);
        
        // I get valid accessKeyId, sessionToken, secretAccessKey

        // this.amplifyService.auth().currentSession()
        //   .then(currentSession => console.table('currentSession= ' + currentSession))
        //   .catch(error => console.error(error));
        // // I get an error: no current user

        // this.amplifyService.auth().currentUserPoolUser()
        //   .then(currentUser => console.table('currentUserPoolUser= ' + currentUser))
        //   .catch(error => console.error(error));
        // // I get an error: No current user in userpool

        // this.amplifyService.auth().currentAuthenticatedUser()
        //   .then(currentAuthUser => console.table('currentAuthUser= ' + currentAuthUser))
        //   .catch(error => console.error(error));
        // // I get an error: not authenticated
      })
      .catch(error => console.error(error));
    */

  }

  signInWithGoogle(): void {
    this.socialAuthService.authState.subscribe((user) => {
      this.googleUser = user;
      this.googleUserLoggedIn = (user != null);
      console.log('user: ', user);
    });
    
    this.socialAuthService.signIn(GoogleLoginProvider.PROVIDER_ID);
  }

  signOutGoogle(): void {
    this.socialAuthService.signOut();
  }

  refreshGoogleToken(): void {
    this.socialAuthService.refreshAuthToken(GoogleLoginProvider.PROVIDER_ID);
  }

}
