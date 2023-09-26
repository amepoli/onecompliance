import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';

import { FuseConfigService } from '@fuse/services/config.service';
import { fuseAnimations } from '@fuse/animations';

import { Router, ActivatedRoute } from '@angular/router';
import { AuthService, DialogService } from '../services';
import { TimezoneService } from '../services/timezone.service';


@Component({
    selector: 'login-page',
    templateUrl: './login-page.component.html',
    styleUrls: ['./login-page.component.scss'],
    animations: fuseAnimations
})
export class LoginPageComponent implements OnInit {
    loginForm: UntypedFormGroup;
    confirmSignInForm: UntypedFormGroup;

    user: any;

    confirmSignIn: boolean = false;
    confirmingSignIn: boolean = false;

    signedIn: boolean = false;
    signingIn: boolean = false;
    requireNewPassword: boolean = false;
    forgotPassword: boolean = false;

    loadingSession: boolean = false;

    // Text to show on Login button
    loginButtonText = 'LOGIN';

    // Url used to return to after successfully logging in
    returnUrl = '/oc/homepage';

    /**
     * Constructor
     *
     * @param {FuseConfigService} _fuseConfigService
     * @param {FormBuilder} _formBuilder
     */
    constructor(
        private authService: AuthService,
        private _fuseConfigService: FuseConfigService,
        private _formBuilder: UntypedFormBuilder,
        private router: Router,
        private _dialogService: DialogService,
        private _route: ActivatedRoute,
        private _timezoneService: TimezoneService
    ) {
        // Configure the layout
        this._fuseConfigService.config = {
            layout: {
                navbar: {
                    hidden: true
                },
                toolbar: {
                    hidden: true
                },
                footer: {
                    hidden: true
                },
                sidepanel: {
                    hidden: true
                }
            }
        };

        this.authService = authService;

        this.loginForm = this._formBuilder.group({
            username: ['', Validators.required],
            password: ['', Validators.required]
        });

        this.confirmSignInForm = this._formBuilder.group({
            challenge: ['', Validators.required]
        });
        

    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {

        // Check if we are supposed to redirect after logging in.
        let returnPath = this._route.snapshot.paramMap.get("return_path");
        if (returnPath) {
            this.returnUrl = decodeURIComponent(returnPath)
        }

        this.authService.authStateChange$
            .subscribe(authState => {
                this.confirmSignIn = authState.state === 'confirmSignIn';
                this.signedIn = authState.state === 'signedIn';
                this.requireNewPassword = authState.state === 'requireNewPassword';
                this.forgotPassword = authState.state === 'forgotPassword';
                if(this.confirmSignIn) {
                    this._dialogService.closeDialog();
                    this.signingIn = false;
                    this.loginButtonText = 'VERIFY OTP';
                }
                else if(this.requireNewPassword) {
                    this._dialogService.closeDialog();
                    this.router.navigate(['/change-password']);
                }
                else if(this.forgotPassword) {
                    this._dialogService.closeDialog();
                    this.router.navigate(['/forgot-password']);
                }
                else {
                    if (!authState.user) {
                        this.user = null;
                    } else {
                        this.user = authState.user;
                    }
                }
            }, error => {
                // Error occured!
                this._dialogService.closeDialog();
                this.signingIn = false;
                this.confirmingSignIn = false;
                this.loginButtonText = 'LOGIN';
            });

        // Subscribe to Error EventEmitter in AuthService 
        this.authService.errorInfo$
            .subscribe(err => {
                // Check if we were actually signing in or just loading old session
                if (this.signingIn) {
                    this._dialogService.showErrorDialog("Error", err.message ? err.message : "Incorrect username or password");
                    this.signingIn = false;
                    this.loginButtonText = 'LOGIN';
                }
                else if (this.confirmingSignIn) {
                    this._dialogService.showErrorDialog("Error", err.message ? err.message : "Incorrect OTP");
                    this.confirmingSignIn = false;
                    this.loginButtonText = 'VERIFY';
                }
                else {
                    // We failed to load previous session
                    this._dialogService.closeDialog();
                    this.loadingSession = false;
                    this.loginButtonText = 'LOGIN';
                }
                // console.error(`Login Error: ${err}`);
            }, error => {
                // Error occured!
                this._dialogService.closeDialog();
                this.confirmSignIn = false;
                this.signingIn = false;
                this.loginButtonText = 'LOGIN';
            });


        // subscribe to backend retrieval of user info
        this.authService.userinfo.subscribe(info => {
            if (info && info.username != null) {
                // got info from backend, now we can proceed
                this.authService.setUsername(info.username);
                this._dialogService.closeDialog();
                this.router.navigate([this.returnUrl]);
            }
            else {
                this._dialogService.closeDialog();
                this.loadingSession = false;
                this.loginButtonText = 'LOGIN';
            }
        }, error => {
            // Error occured!
            this._dialogService.closeDialog();
            this.signingIn = false;
            this.confirmSignIn = false;
            this.loginButtonText = 'LOGIN';
        });

        // Check if local storage contains valid access token
        if (this.authService.doesAccessTokenExist()) {
            // Load session from local storage
            this.loadingSession = true;
            this.loginButtonText = 'PLEASE WAIT';
            this._dialogService.showLoadingDialog("Loading", "Please wait...");
            this.authService.loadSession();
        }        
    }

    onSubmit(e): void {
        // Cognito fix
        e.preventDefault();
        
        this.authService.setUsername(this.loginForm.value.username);
        this.authService.setPassword(this.loginForm.value.password);

        this.loginButtonText = 'PLEASE WAIT';

        // Show loading Alert
        this._dialogService.showLoadingDialog("Signing in", "Please wait...");

        // Sign in
        this.signingIn = true;
        this.authService.signIn();

        // this.authService.fetchGoogleUser();
    }

    onConfirmSignInSubmit(e): void {
        // Cognito fix
        e.preventDefault();
        
        var challenge = this.confirmSignInForm.value.challenge;
        
        this.loginButtonText = 'PLEASE WAIT';

        // Show loading Alert
        this._dialogService.showLoadingDialog("Verifying", "Please wait...");

        // Sign in
        this.confirmSignIn = true;
        this.confirmingSignIn = true;
        this.authService.confirmSignIn(challenge);

        // this.authService.fetchGoogleUser();
    }
}
