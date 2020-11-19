import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { FuseConfigService } from '@fuse/services/config.service';
import { fuseAnimations } from '@fuse/animations';
import { AuthService } from './auth.service';

import { Router, ActivatedRoute } from '@angular/router';
import { DialogService } from '../services/dialog.service';


@Component({
    selector: 'login-page',
    templateUrl: './login-page.component.html',
    styleUrls: ['./login-page.component.scss'],
    animations: fuseAnimations
})
export class LoginPageComponent implements OnInit {
    loginForm: FormGroup;
    user: any;
    signedIn = false;
    signingIn: boolean = false;
    loadingSession: boolean = false;

    // Text to show on Login button
    loginButtonText = 'LOGIN';

    // Url used to return to after successfully logging in
    returnUrl = '/gorico/dashboard';

    /**
     * Constructor
     *
     * @param {FuseConfigService} _fuseConfigService
     * @param {FormBuilder} _formBuilder
     */
    constructor(
        private authService: AuthService,
        private _fuseConfigService: FuseConfigService,
        private _formBuilder: FormBuilder,
        private router: Router,
        private _dialogService: DialogService,
        private _route: ActivatedRoute
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
                this.signedIn = authState.state === 'signedIn';
                if (!authState.user) {
                    this.user = null;
                } else {
                    this.user = authState.user;
                }
            }, error => {
                // Error occured!
                this._dialogService.closeDialog();
                this.signingIn = false;
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

    onSubmit(): void {
        this.authService.setUsername(this.loginForm.value.username);
        this.authService.setPassword(this.loginForm.value.password);

        this.loginButtonText = 'PLEASE WAIT';

        // Show loading Alert
        this._dialogService.showLoadingDialog("Signing in", "Please wait...");

        // Sign in
        this.signingIn = true;
        this.authService.signIn();
    }
}
