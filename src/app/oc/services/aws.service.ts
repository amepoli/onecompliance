import { Injectable, EventEmitter } from "@angular/core";
import { AmplifyService } from "aws-amplify-angular";
import { Observable } from "rxjs/Observable";
import { AuthState } from "aws-amplify-angular/dist/src/providers/auth.state";
import { BackendService } from "./backend.service";
import { BehaviorSubject } from "rxjs";
import { TranslateService } from "@ngx-translate/core";
import { FuseNavigationService } from "@fuse/components/navigation/navigation.service";
import { ToastService } from "app/oc/services/toast.service";

import { FuseTranslationLoaderService } from "@fuse/services/translation-loader.service";
import { ConsoleLoggerService } from "./console_logger.service";
import { OCAuthState, UserInfo } from "../interfaces";

import { ActivatedRouteSnapshot, RouterStateSnapshot } from "@angular/router";
declare var gapi: any;
declare var auth2: any;

const appData = (environment.appData as any).default;

import {
    AdminGetUserCommand,
    AdminSetUserMFAPreferenceCommand,
    AuthFlowType,
    ChallengeNameType,
    CodeDeliveryFailureException,
    CognitoIdentityProvider,
    CognitoIdentityProviderClient,
    ConfirmForgotPasswordCommand,
    ConfirmSignUpCommand,
    ForgotPasswordCommand,
    InitiateAuthCommand,
    RespondToAuthChallengeCommand,
    SetUserMFAPreferenceCommand,
    SignUpCommand,
} from "@aws-sdk/client-cognito-identity-provider";

import {
    createClientForDefaultRegion,
    DEFAULT_REGION,
    generateSecretHash,
    parseJwt,
} from "../utils";
import { environment } from "environments/environment";
import { HttpClient } from "@angular/common/http";
import { I } from "@angular/cdk/keycodes";
import { access } from "fs";
import { fromWebToken } from "@aws-sdk/credential-providers";
import { GetRoleCommand, IAMClient } from "@aws-sdk/client-iam";

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
    constructor(private http: HttpClient, private awsService: AwsService) {
        this.authStateChange$ = new BehaviorSubject<OCAuthState>({
            state: null,
        });

        this.errorInfo$ = new BehaviorSubject<any>(null);
    }

    public authStateChange$: BehaviorSubject<OCAuthState> = null;

    public errorInfo$: BehaviorSubject<any> = null;

    // Used to get user's mfa status
    public mfa: string;

    public setAuthState(state: OCAuthState) {
        this.authStateChange$.next(state);
    }

    public init() {
        const session = localStorage.getItem("session");
        if (session) {
            let authState: OCAuthState = {
                session: JSON.parse(localStorage.getItem("session")),
                state: "signedIn",
                user: JSON.parse(localStorage.getItem("user")),
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

    public async setupTOTP(): Promise<string> {
        const _this = this;

        try {
            let session = this.currentSessionInfo();
            let secretcode = "";
            if (session) {
                const params = {
                    AccessToken: session.AccessToken,
                };
                const client = new CognitoIdentityProvider({
                    region: DEFAULT_REGION,
                });

                let result = client.associateSoftwareToken(params);
                if (result != null) {
                    secretcode = result["SecretCode"];
                }
                return secretcode;
            }
        } catch (error) {
            _this.errorInfo$.next(error);
        }
    }

    public async VerifyTOTP(code: any): Promise<any> {
        const _this = this;

        try {
            let session = this.currentSessionInfo();
            if (session) {
                const params = {
                    AccessToken: session.AccessToken,
                    UserCode: code,
                };
                const client = new CognitoIdentityProvider({
                    region: DEFAULT_REGION,
                });

                let result = client.verifySoftwareToken(params);
                return result;
            }
        } catch (error) {
            _this.errorInfo$.next(error);
        }
    }

    public async getRoleArn() {
        const _this = this;
        const client = new IAMClient({
            region: DEFAULT_REGION,
        });

        const command = new GetRoleCommand({
            RoleName: "AuditFT",
        });

        try {
            const response = await client.send(command);
            return response;
        } catch (e) {
            _this.errorInfo$.next(e);
            console.log(e);
            return null;
        }
    }

    public async setPreferredMFA(isEnabled: boolean) {
        const _this = this;
        let session = this.currentSessionInfo();
        if (session) {
            // var role = await this.getRoleArn();

            var params = {
                AccessToken: session.AccessToken, //AccessToken,
                SMSMfaSettings: {
                    Enabled: false,
                    PreferredMfa: false,
                },
                SoftwareTokenMfaSettings: {
                    Enabled: isEnabled,
                    PreferredMfa: isEnabled,
                },
                // Username: session.username, // required
                // UserPoolId: environment.appData.awsSdk.UserPoolId,
            };

            // const client = createClientForDefaultRegion(CognitoIdentityProviderClient);

            // const client = new CognitoIdentityProviderClient({
            //   region: DEFAULT_REGION,
            // });

            const client = new CognitoIdentityProvider({
                region: DEFAULT_REGION,
                credentials: fromWebToken({
                    // Required. ARN of the role that the caller is assuming.
                    // roleArn: "arn:aws:iam::1234567890:role/RoleA",
                    roleArn:
                        "arn:aws:iam::360720986746:role/fuseangular-20181004222815-authRole",
                    // roleArn: "arn:aws:iam::360720986746:role/service-role/users_role",
                    // Required. The OAuth 2.0 access token or OpenID Connect ID token that is provided by the
                    // identity provider.
                    webIdentityToken: session.IdToken,
                }),
            });

            const command = new SetUserMFAPreferenceCommand(params);

            try {
                const response = await client.send(command); //setUserMFAPreference(params); // .
                return true;
            } catch (e) {
                _this.errorInfo$.next(e);
                console.log(e);
                return false;
            }
        }
    }

    public async signUp(username: string, password: string, email: string) {
        const _this = this;

        const secretHash = generateSecretHash(username);
        const client = new CognitoIdentityProviderClient({
            region: DEFAULT_REGION,
        });

        const command = new SignUpCommand({
            ClientId: environment.appData.awsSdk.ClientId,
            Password: password,
            SecretHash: secretHash,
            UserAttributes: [
                {
                    Name: "Email",
                    Value: email,
                },
            ],
            Username: username,
        });
        try {
            const result = await client.send(command);
            _this.setAuthState({
                state: "sign-up",
                user: result,
            });
        } catch (error) {
            _this.errorInfo$.next(error);
            console.log(error.message ?? error);
        }
    }

    public async confirmSignUp(username: string, code: string) {
        const _this = this;

        const secretHash = generateSecretHash(username);
        const client = new CognitoIdentityProviderClient({
            region: DEFAULT_REGION,
        });

        const command = new ConfirmSignUpCommand({
            ClientId: environment.appData.awsSdk.ClientId,
            ConfirmationCode: code,
            SecretHash: secretHash,
            Username: username,
        });
        try {
            const result = await client.send(command);
            return result;
        } catch (error) {
            _this.errorInfo$.next(error);
            console.log(error.message ?? error);
        }
    }

    public async forgotPassword(username: string) {
        const _this = this;

        try {
            const secretHash = generateSecretHash(username);
            const client = new CognitoIdentityProviderClient({
                region: DEFAULT_REGION,
            });

            const command = new ForgotPasswordCommand({
                ClientId: environment.appData.awsSdk.ClientId,
                SecretHash: secretHash,
                Username: username,
            });

            const result = await client.send(command);
            return result;
        } catch (error) {
            _this.errorInfo$.next(error);
        }
    }

    public async ConfirmForgotPassword(
        username: string,
        code: string,
        new_password: string
    ) {
        const _this = this;

        try {
            const secretHash = generateSecretHash(username);
            const client = new CognitoIdentityProviderClient({
                region: DEFAULT_REGION,
            });

            const command = new ConfirmForgotPasswordCommand({
                ClientId: environment.appData.awsSdk.ClientId,
                SecretHash: secretHash,
                Username: username,
                ConfirmationCode: code,
                Password: new_password,
            });
            const result = await client.send(command);
            return result;
        } catch (error) {
            _this.errorInfo$.next(error);
        }
    }

    public async signIn(username: string, password: string) {
        const _this = this;

        const secretHash = generateSecretHash(username);
        const client = new CognitoIdentityProviderClient({
            region: DEFAULT_REGION,
        });

        const command = new InitiateAuthCommand({
            AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
            AuthParameters: {
                USERNAME: username,
                PASSWORD: password,
                SECRET_HASH: secretHash,
            },
            ClientId: environment.appData.awsSdk.ClientId,
        });

        try {
            const result = await client.send(command);
            _this.mfa = result.ChallengeName;
            if (
                result.ChallengeName == ChallengeNameType.SOFTWARE_TOKEN_MFA ||
                result.ChallengeName == ChallengeNameType.SMS_MFA
            ) {
                _this.setAuthState({
                    state: "confirmSignIn",
                    user: result,
                });
            } else {
                _this.setAuthState({
                    state: "signedIn",
                    user: result,
                });
            }
            return result;
        } catch (error) {
            _this.errorInfo$.next(error);
            console.log(error.message ?? error);
        }
    }

    public async confirmSignIn(
        signInResponse: any,
        challenge: string,
        challengeName: string = "SOFTWARE_TOKEN_MFA"
    ) {
        const _this = this;
        const secretHash = generateSecretHash(
            signInResponse.ChallengeParameters.USER_ID_FOR_SRP
        );
        const client = createClientForDefaultRegion(
            CognitoIdentityProviderClient
        );

        const command = new RespondToAuthChallengeCommand({
            ChallengeName: ChallengeNameType.SOFTWARE_TOKEN_MFA,
            ChallengeResponses: {
                SOFTWARE_TOKEN_MFA_CODE: challenge,
                USERNAME: signInResponse.ChallengeParameters.USER_ID_FOR_SRP,
                SECRET_HASH: secretHash,
            },
            ClientId: environment.appData.awsSdk.ClientId,
            Session: signInResponse.Session,
        });

        try {
            let result = await client.send(command);
            console.log(result);
            if (result["ChallengeName"] === "NEW_PASSWORD_REQUIRED") {
                _this.setAuthState({
                    state: "requireNewPassword",
                    user: result,
                });
            } else {
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
            return true;
        } catch (e: any) {
            console.log(e.message ?? e);
            _this.errorInfo$.next(e);
            // return e;
        }
    }

    public async getUserInfo() {
        // const _this = this;
        // try {
        //   const url = 'https://onecompliance.auth.eu-central-1.amazoncognito.com/oauth2/userInfo'; //environment.appData.awsSdk.GatewayURL + 'oauth2/userInfo'
        //   const response = await _this.http.get(url,{
        //     headers: {
        //       "Authorization": `Bearer ${_this.authStateChange$.value.session.IdToken}`,
        //       "Content-Type": "text/plain"
        //     }
        //   }).toPromise();
        //   return response;
        // }
        // catch(e) {
        //   console.log(JSON.stringify(e));
    }

    public setUserMFA(newMFA) {
        this.mfa = newMFA;
        let authStateChange = this.authStateChange$.value;
        authStateChange.user.preferredMFA = newMFA;
        this.authStateChange$.next(authStateChange);
    }

    public async refreshToken() {
        const _this = this;
        if (localStorage.getItem("session")) {
            const session = JSON.parse(localStorage.getItem("session"));
            let currentDateTime = Math.trunc(new Date().getTime() / 1000);
            let expiry;
            if (session["exp"] != null) {
                expiry = session["exp"];
            }
            if (currentDateTime > expiry) {
                const secretHash = generateSecretHash(session["username"]);
                // const myPutPostInit = { // OPTIONAL
                //   body: {
                //     secretHash,
                //     refreshToken: session['RefreshToken']
                //   },
                //   headers: {
                //   }, // OPTIONAL
                //   queryStringParameters: {refresh_token: 1}
                // };

                // try {
                //   const url = environment.appData.awsSdk.GatewayURL + appData.lambdas.users.apiName; //'view?entry_name=progetti&company=TEST';
                //   const result = await _this.http.post(
                //     url,
                //     myPutPostInit.body,
                //     {
                //       headers: myPutPostInit.headers || {
                //         // "Authorization": `Bearer ${_this.authStateChange$.value.session.IdToken}`,
                //         "Content-Type": "text/plain",
                //         "UserId": _this.authStateChange$.value.session.sub
                //       },
                //       params: myPutPostInit.queryStringParameters
                //     }
                //   ).toPromise();
                //   console.log(result);
                //   return result;
                // }
                // catch (error) {
                //   _this.awsService.errorInfo$.next(error);
                //   console.log(error.message ?? error);
                // }

                // try {
                //   const refreshTokenResult = await _this.awsService.api().post(appData.apiName, appData.lambdas.users.apiName, myPutPostInit)
                //   console.log(refreshTokenResult);
                //   if(refreshTokenResult) {

                //   }
                //   else {
                //     _this.errorInfo$.next('Token expired!');
                //   }
                // }
                // catch(err) {
                //   _this.errorInfo$.next(err);
                //   console.log('RefreshTokenError: ', err);
                // }

                const params = {
                    AuthFlow: "REFRESH_TOKEN_AUTH",
                    ClientId: session["client_id"],
                    AuthParameters: {
                        REFRESH_TOKEN: session["RefreshToken"],
                        SECRET_HASH: secretHash,
                    },
                };
                const client = new CognitoIdentityProvider({
                    region: DEFAULT_REGION,
                });

                client.initiateAuth(params, (err, data) => {
                    if (err) {
                        _this.errorInfo$.next(err);
                        console.log("RefreshTokenError: ", err.stack);
                    } else {
                        console.log("RefreshTokenResponse: ", data);
                        if (data != null) {
                            var t = new Date();
                            t.setSeconds(t.getSeconds() + 3600);
                            let exp = Math.trunc(t.getTime() / 1000);
                            session["exp"] = exp;
                            session["AccessToken"] =
                                data.AuthenticationResult.AccessToken;
                            session["IdToken"] =
                                data.AuthenticationResult.IdToken;

                            if (!_this.authStateChange$) {
                                if (session) {
                                    let authState: OCAuthState = {
                                        session: JSON.parse(
                                            localStorage.getItem("session")
                                        ),
                                        state: "signedIn",
                                        user: JSON.parse(
                                            localStorage.getItem("user")
                                        ),
                                    };
                                    _this.authStateChange$.next(authState);
                                }
                            } else {
                                let authStateChange: any =
                                    _this.authStateChange$.value;
                                authStateChange.session = session;
                                localStorage.setItem(
                                    "session",
                                    JSON.stringify(authStateChange.session)
                                );
                                _this.authStateChange$.next(authStateChange);
                            }
                        }
                    }
                });
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
        private awsService: AwsService
    ) {}

    public async get(api: string, apiName: string, request: GetRequest) {
        const _this = this;

        // Check if refresh token and access token needs refresh
        await _this.awsService.auth().refreshToken();

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
            console.log(result);
            return result;
        } catch (error) {
            _this.awsService.errorInfo$.next(error);
            console.log(error.message ?? error);
        }
    }

    public async post(api: string, apiName: string, request: PutPostRequest) {
        const _this = this;

        // Check if refresh token and access token needs refresh
        await _this.awsService.auth().refreshToken();

        try {
            const url = environment.appData.awsSdk.GatewayURL + apiName; //'view?entry_name=progetti&company=TEST';
            const result = await _this.http
                .post(url, request.body, {
                    headers: request.headers || {
                        Authorization: `Bearer ${_this.authStateChange$.value.session.IdToken}`,
                        "Content-Type": "text/plain",
                        UserId: _this.authStateChange$.value.session.sub,
                    },
                    params: request.queryStringParameters,
                })
                .toPromise();
            console.log(result);
            return result;
        } catch (error) {
            _this.awsService.errorInfo$.next(error);
            console.log(error.message ?? error);
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
                    headers: request.headers || {
                        Authorization: `Bearer ${_this.authStateChange$.value.session.IdToken}`,
                        "Content-Type": "text/plain",
                        UserId: _this.authStateChange$.value.session.sub,
                    },
                    params: request.queryStringParameters,
                })
                .toPromise();
            console.log(result);
            return result;
        } catch (error) {
            _this.awsService.errorInfo$.next(error);
            console.log(error.message ?? error);
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
                    headers: request.headers || {
                        Authorization: `Bearer ${_this.authStateChange$.value.session.IdToken}`,
                        "Content-Type": "text/plain",
                        UserId: _this.authStateChange$.value.session.sub,
                    },
                    params: request.queryStringParameters,
                })
                .toPromise();
            console.log(result);
            return result;
        } catch (error) {
            _this.awsService.errorInfo$.next(error);
            console.log(error.message ?? error);
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

    constructor(private http: HttpClient) {
        this.api();
    }

    public auth() {
        if (!this._auth) {
            this._auth = new Auth(this.http, this);
            this._auth.init();
        }
        return this._auth;
    }

    public api() {
        if (!this._api) {
            this.auth();
            this._api = new Api(this.authStateChange$, this.http, this);
        }
        return this._api;
    }

    public setAuthState(state: OCAuthState) {
        this.auth().setAuthState(state);
    }
}
