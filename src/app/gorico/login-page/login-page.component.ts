import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { FuseConfigService } from '@fuse/services/config.service';
import { fuseAnimations } from '@fuse/animations';
import { AuthService } from './auth.service';

import { Router } from '@angular/router';

@Component({
    selector   : 'login-page',
    templateUrl: './login-page.component.html',
    styleUrls  : ['./login-page.component.scss'],
    animations : fuseAnimations
})
export class LoginPageComponent implements OnInit
{
    loginForm: FormGroup;
    user: any;
    signedIn = false;

    /**
     * Constructor
     *
     * @param {FuseConfigService} _fuseConfigService
     * @param {FormBuilder} _formBuilder
     */
    constructor(
        public authService: AuthService,
        private _fuseConfigService: FuseConfigService,
        private _formBuilder: FormBuilder,
        private router: Router
    )
    {
        // Configure the layout
        this._fuseConfigService.config = {
            layout: {
                navbar   : {
                    hidden: true
                },
                toolbar  : {
                    hidden: true
                },
                footer   : {
                    hidden: true
                },
                sidepanel: {
                    hidden: true
                }
            }
        };

        this.authService = authService;

    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void
    {
        this.loginForm = this._formBuilder.group({
            username: ['', Validators.required],
            password: ['', Validators.required]
        });

        this.authService.authStateChange$
          .subscribe(authState => {
            this.signedIn = authState.state === 'signedIn';
            
            if (!authState.user) {
                this.user = null;
            } else {
                this.user = authState.user;
            }
            
            if (this.signedIn)
            {
               this.router.navigate(['/gorico/dashboard']);
            }
        });
    }

    onSubmit(): void 
    {
        this.authService.setUsername(this.loginForm.value.username);
        this.authService.setPassword(this.loginForm.value.password);
        this.authService.signIn();
    }
}
