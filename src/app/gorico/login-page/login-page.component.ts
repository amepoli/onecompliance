import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { FuseConfigService } from '@fuse/services/config.service';
import { fuseAnimations } from '@fuse/animations';
import { AuthService } from './auth.service';

import { Router } from '@angular/router';
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
        private _dialogService: DialogService
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

        this.authService.authStateChange$
            .subscribe(authState => {
                this._dialogService.closeDialog();
                this.signedIn = authState.state === 'signedIn';

                if (!authState.user) {
                    this.user = null;
                } else {
                    this.user = authState.user;
                }
            });

        // Subscribe to Error EventEmitter in AuthService 
        this.authService.errorInfo$
            .subscribe(err => {
                // Check if we were actually signing in or just loading old session
                if (this.signingIn) {
                    this._dialogService.showErrorDialog("Error", err.message ? err.message : "Incorrect username or password");
                    this.signingIn = false;
                }
                else {
                    // We failed to load previous session
                    this._dialogService.closeDialog();
                    this.loadingSession = false;
                }
                // console.error(`Login Error: ${err}`);
            });


        // subscribe to backend retrieval of user info
        this.authService.userinfo.subscribe(info => {
            if (info.username != null) {
                // got info from backend, now we can proceed
                this.router.navigate(['/gorico/dashboard']);
            }
        });

        // Check if local storage contains valid access token
        if (this.authService.doesAccessTokenExist()) {
            // Load session from local storage
            this.loadingSession = true;
            this._dialogService.showLoadingDialog("Loading", "Please wait...");
            this.authService.loadSession();
        }

    }

    onSubmit(): void {
        this.authService.setUsername(this.loginForm.value.username);
        this.authService.setPassword(this.loginForm.value.password);
        // Show loading Alert
        this._dialogService.showLoadingDialog("Signing in", "Please wait...");

        // Sign in
        this.signingIn = true;
        this.authService.signIn();
    }
}
