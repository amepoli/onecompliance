import { Injectable } from "@angular/core";
import { Observable } from "rxjs/Observable";
import { BehaviorSubject, from } from "rxjs";
import { ConsoleLoggerService } from "./console_logger.service";
import { OCAuthState, PostRequest } from "../interfaces";
const appData = (environment.appData as any).default;
import { parseJwt } from "../utils";
import { environment } from "environments/environment";
import { HttpClient } from "@angular/common/http";

interface GetRequest {
    // OPTIONAL
    headers?: any; // OPTIONAL
    queryStringParameters: any;
}

interface PutPostRequest {
    // OPTIONAL
    body: any;
    headers?: any; // OPTIONAL
    queryStringParameters?: any; // OPTIONAL
}

class Auth {
    constructor(private http: HttpClient, private _console: ConsoleLoggerService, private awsService: AwsService) {
        this.authStateChange$ = new BehaviorSubject<OCAuthState>({
            state: null,
        });

        this.errorInfo$ = new BehaviorSubject<any>(null);
    }

    public authStateChange$: BehaviorSubject<OCAuthState> = null;

    public errorInfo$: BehaviorSubject<any> = null;

    // Used to get user's mfa status
    public mfa: string = 'NOMFA';

    public setAuthState(state: OCAuthState) {
        this.authStateChange$.next(state);
    }

    public init() {
        const session = localStorage.getItem("session");
        if (session) {
            let authState: OCAuthState = {
                session: JSON.parse(localStorage.getItem("session")),
                state: "signedIn",
                user: {
                    preferredMFA: 'NOMFA',
                    ...(JSON.parse(localStorage.getItem("user"))),
                }
            };
            this.authStateChange$.next(authState);
        }
    }

    public currentUserInfo() {
        if (this.authStateChange$.value.user) {
            return this.authStateChange$.value.user;
        } else {
            const user = localStorage.getItem("user");
            if (user) {
                return JSON.parse(user);
            }
        }
        return null;
    }

    public currentSessionInfo() {
        if (this.authStateChange$.value.session) {
            return this.authStateChange$.value.session;
        } else {
            const session = localStorage.getItem("session");
            if (session) {
                return JSON.parse(session);
            }
        }
        return null;
    }

    public loadSignInResponse(result) {
        const _this = this;
        const accessTokenData = parseJwt(
            result.AuthenticationResult.AccessToken
        );
        const idTokenData = parseJwt(
            result.AuthenticationResult.IdToken
        );
        const user = {
            attributes: {
                email: idTokenData.email,
                email_verified: idTokenData.email_verified,
                sub: idTokenData.sub,
            },
            id: idTokenData.sub,
            username: accessTokenData.username,
            preferredMFA: _this.mfa,
        };

        _this.setAuthState({
            state: "signedIn",
            session: {
                ...result.AuthenticationResult,
                ...accessTokenData,
            },
            user: user,
        });

        localStorage.setItem(
            "session",
            JSON.stringify(_this.authStateChange$.value.session)
        );
        localStorage.setItem("user", JSON.stringify(user));
    }

    public setUserMFA(newMFA) {
        this.mfa = newMFA;
        let authStateChange = this.authStateChange$.value;
        authStateChange.user.preferredMFA = newMFA;
        this.authStateChange$.next(authStateChange);
    }

    public async refreshToken(forced: boolean = false) {
        let _this = this;
        if (localStorage.getItem("session")) {
            const session = JSON.parse(localStorage.getItem("session"));
            let currentDateTime = Math.trunc(new Date().getTime() / 1000);
            let expiry: number;
            if (session["exp"] != null) {
              expiry = session["exp"];
            }
            if (currentDateTime > expiry || forced) {   
              try {
                let username = session["username"];
                let refreshToken = session["RefreshToken"];
                const putPostReq: PostRequest = {
                    headers: {},
                    queryStringParameters: { refresh_token: 1 },
                    body: {
                        username,
                        refreshToken
                    },
                  };
                let result = await from(this.awsService.api().post(appData.apiName, appData.lambdas.auth.apiName, putPostReq, true)).toPromise() as Observable<any>;
                if (result && result["result"] === "OK") { 
                  let data = result["data"];
                  if (data != null) {
                    var t = new Date();
                    t.setSeconds(t.getSeconds() + 3600);
                    let exp = Math.trunc(t.getTime() / 1000);
                    session["exp"] = exp;
                    session["AccessToken"] = data.AuthenticationResult.AccessToken;
                    session["IdToken"] = data.AuthenticationResult.IdToken;
                    if (!_this.authStateChange$) {
                      if (session) {
                        let authState: OCAuthState = {
                          session: JSON.parse(localStorage.getItem("session")),       
                          state: "signedIn",
                          user: {
                            preferredMFA: 'NOMFA',
                            ...(JSON.parse(
                              localStorage.getItem("user")
                            )),
                          }
                        };
                        _this.authStateChange$.next(authState);
                      }
                    } else {
                      let authStateChange: any =
                      _this.authStateChange$.value;
                      authStateChange.session = session;
                      localStorage.setItem("session", JSON.stringify(authStateChange.session));
                      _this.authStateChange$.next(authStateChange);
                    }
                  }
                } else {
                  _this.errorInfo$.next(result["reason"]);
                }
              } catch (error) {
                _this._console.log(error)
              }
            }
        }
    }

    public async signOut() {
        const _this = this;
        const logout_uri = "www.testing.com";
        const clientId = environment.appData.awsSdk.ClientId;
        const domain =
            environment.appData.dynamoTables.external_authentications
                .redirectUri;
        const url = `${domain}/logout?client_id=${clientId}&logout_uri=${logout_uri}`;
        const response = await _this.http
            .get(url, {
                headers: {
                    Authorization: `Bearer ${_this.authStateChange$.value.session.IdToken}`,
                    "Content-Type": "text/plain",
                },
            })
            .toPromise();
    }
}

class Api {
    constructor(
        private authStateChange$: BehaviorSubject<OCAuthState>,
        private http: HttpClient,
        private _console: ConsoleLoggerService,
        private awsService: AwsService
    ) { }

    public async get(api: string, apiName: string, request: GetRequest) {
        const _this = this;

        // Check if refresh token and access token needs refresh
        await _this.awsService.auth().refreshToken();
        //_this._console.log(_this.authStateChange$.value.session)

        // _this.awsService.auth().
        try {
            const url = environment.appData.awsSdk.GatewayURL + apiName; //'view?entry_name=progetti&company=TEST';
            const result = await _this.http
                .get(url, {
                    headers:
                        request.headers &&
                            Object.keys(request.headers).length > 0
                            ? request.headers
                            : {
                                Authorization: `Bearer ${_this.authStateChange$.value.session.IdToken}`,
                                "Content-Type": "text/plain",
                                UserId: _this.authStateChange$.value.session
                                    .sub,
                            },
                    params: request.queryStringParameters,
                })
                .toPromise();
            _this._console.log(result);
            return result;
        } catch (error) {
            _this.awsService.errorInfo$.next(error);
            _this._console.log(error.message ?? error);
            return null;
        }
    }

    public async post(api: string, apiName: string, request: PutPostRequest, isRefreshTokenCall: boolean = false) {

        const _this = this;
        // Check if refresh token and access token needs refresh
        if (!isRefreshTokenCall) {
            await _this.awsService.auth().refreshToken();
        }

        try {
            const url = environment.appData.awsSdk.GatewayURL + apiName; //'view?entry_name=progetti&company=TEST';
            const result = await _this.http
                .post(url, request.body, {
                    headers:
                        request.headers &&
                            Object.keys(request.headers).length > 0
                            ? request.headers
                            : (_this.authStateChange$.value?.session ? {
                                Authorization: `Bearer ${_this.authStateChange$.value?.session?.IdToken}`,
                                "Content-Type": "text/plain",
                                UserId: _this.authStateChange$.value?.session?.sub,
                            } : {
                                "Content-Type": "text/plain"
                            }),
                    params: request.queryStringParameters,
                })
                .toPromise();
            _this._console.log(result);
            return result;
        } catch (error) {
            _this.awsService.errorInfo$.next(error);
            _this._console.log(error.message ?? error);
        }
    }

    public async del(api: string, apiName: string, request: GetRequest) {
        const _this = this;

        // Check if refresh token and access token needs refresh
        await _this.awsService.auth().refreshToken();

        try {
            const url = environment.appData.awsSdk.GatewayURL + apiName; //'view?entry_name=progetti&company=TEST';
            const result = await _this.http
                .delete(url, {
                    headers:
                        request.headers &&
                            Object.keys(request.headers).length > 0
                            ? request.headers
                            : {
                                Authorization: `Bearer ${_this.authStateChange$.value.session.IdToken}`,
                                "Content-Type": "text/plain",
                                UserId: _this.authStateChange$.value.session
                                    .sub,
                            },
                    params: request.queryStringParameters,
                })
                .toPromise();
            _this._console.log(result);
            return result;
        } catch (error) {
            _this.awsService.errorInfo$.next(error);
            _this._console.log(error.message ?? error);
        }
    }

    public async put(api: string, apiName: string, request: PutPostRequest) {
        const _this = this;

        // Check if refresh token and access token needs refresh
        await _this.awsService.auth().refreshToken();

        try {
            const url = environment.appData.awsSdk.GatewayURL + apiName; //'view?entry_name=progetti&company=TEST';
            const result = await _this.http
                .put(url, request.body, {
                    headers:
                        request.headers &&
                            Object.keys(request.headers).length > 0
                            ? request.headers
                            : {
                                Authorization: `Bearer ${_this.authStateChange$.value.session.IdToken}`,
                                "Content-Type": "text/plain",
                                UserId: _this.authStateChange$.value.session
                                    .sub,
                            },
                    params: request.queryStringParameters,
                })
                .toPromise();
            _this._console.log(result);
            return result;
        } catch (error) {
            _this.awsService.errorInfo$.next(error);
            _this._console.log(error.message ?? error);
        }
    }
}

@Injectable({
    providedIn: "root",
})
export class AwsService {
    private _auth: Auth = null;

    private _api: Api = null;

    get authStateChange$(): BehaviorSubject<OCAuthState> | null {
        return this.auth().authStateChange$;
    }

    get errorInfo$(): BehaviorSubject<any> | null {
        return this.auth().errorInfo$;
    }

    constructor(private http: HttpClient, private _console: ConsoleLoggerService) {
        this.api();
    }

    public auth() {
        if (!this._auth) {
            this._auth = new Auth(this.http, this._console, this);
            this._auth.init();
        }
        return this._auth;
    }

    public api() {
        if (!this._api) {
            this.auth();
            this._api = new Api(this.authStateChange$, this.http, this._console, this);
        }
        return this._api;
    }

    public setAuthState(state: OCAuthState) {
        this.auth().setAuthState(state);
    }
}
