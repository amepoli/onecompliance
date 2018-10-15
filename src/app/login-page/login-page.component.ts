import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { FuseConfigService } from '@fuse/services/config.service';
import { fuseAnimations } from '@fuse/animations';
import { AuthService } from './auth.service';

@Component({
    selector   : 'login-page',
    templateUrl: './login-page.component.html',
    styleUrls  : ['./login-page.component.scss'],
    animations : fuseAnimations
})
export class LoginPageComponent implements OnInit
{
    loginForm: FormGroup;

    /**
     * Constructor
     *
     * @param {FuseConfigService} _fuseConfigService
     * @param {FormBuilder} _formBuilder
     */
    constructor(
        public authService: AuthService,
        private _fuseConfigService: FuseConfigService,
        private _formBuilder: FormBuilder
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
    }

    onSubmit(): void 
    {
        console.log(this.loginForm);
        this.authService.setUsername(this.loginForm.value.username);
        this.authService.setPassword(this.loginForm.value.password);
        this.authService.signIn();
        // this.authService.signOut();
    }
}
