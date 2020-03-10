import { Injectable, EventEmitter } from '@angular/core';
import { AmplifyService } from 'aws-amplify-angular';
import { Observable } from 'rxjs/Observable';
import { AuthState } from 'aws-amplify-angular/dist/src/providers/auth.state';
import { BackendService } from '../views/backend/backend.service';
import { BehaviorSubject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { FuseNavigationService } from '@fuse/components/navigation/navigation.service';

export interface UserInfo {
  name: string;
  lastname: string;
  username: string;
  picture: string;
  language: string;
  companies: string[];
}
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
  public errorInfo$ = new EventEmitter<any>();

  private currentCompany: string;

  constructor(
    private amplifyService: AmplifyService,
    private backendService: BackendService,
    private navigationService: FuseNavigationService) {
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
      .then(user => this.amplifyService.setAuthState({ state: 'confirmSignUp', user: { 'username': this.username } }))
      .catch(err => {
        this.errorInfo$.emit(err);
        this._setError(err)
      });
  }

  public updateUserInfo(company: string): void {
    const _this = this;
    if (company == null || company === _this.currentCompany) {
      return;
    }
    _this.currentCompany = company;
    // reset the left menu
    _this.navigationService.setCurrentNavigation('main');
    _this.navigationService.unregister('usermenu');
    // get new menu
    _this.retrieveMenu();

  }

  public getCurrentCompany(): string {
    const _this = this;
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
          if (ud.userdata.language === null) {
            ud.userdata.language = 'it';  // defaults to italian
          }
          _this.userinfo.next(ud.userdata); // signal a value change to subscribers
          _this.currentCompany = ud.userdata.companies[0];
          console.log(ud.userdata);
          // get new menu
          _this.retrieveMenu();
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
      });
  }
}
