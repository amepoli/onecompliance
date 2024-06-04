import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';

import { FuseConfigService } from '@fuse/services/config.service';
import { fuseAnimations } from '@fuse/animations';
import { AuthService } from '../services';

@Component({
    selector   : 'forgot-password',
    templateUrl: './forgot-password.component.html',
    styleUrls  : ['./forgot-password.component.scss'],
    animations : fuseAnimations
})
export class ForgotPasswordComponent implements OnInit
{
    forgotPasswordForm: UntypedFormGroup;

    verificationForm: UntypedFormGroup;

    // Always keep it true because it's not mandatory to use email since AWS Congnito can
    // also provide a code to use
    emailSent = true;

    passwordReset = false;

    hide = true;

    /**
     * Constructor
     *
     * @param {FuseConfigService} _fuseConfigService
     * @param {FormBuilder} _formBuilder
     */
    constructor(
        private _fuseConfigService: FuseConfigService,
        private _formBuilder: UntypedFormBuilder,
        private authService: AuthService
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
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void
    {
        this.forgotPasswordForm = this._formBuilder.group({
            username: ['', Validators.required]
        });

        this.verificationForm = this._formBuilder.group({
            verificationCode: ['', Validators.required],
            password: ['', [Validators.required,
            Validators.pattern('(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[$@$!%*?&_])[A-Za-z\d$@$!%*?&_].{8,}')]]
        });
    }

    onSubmit(): void {
        this.emailSent = true;
        this.passwordReset = false;
        this.authService.forgotPassword(this.forgotPasswordForm.value.username);
    }

    onSubmitCode(): void {
        this.emailSent = true;
        this.passwordReset = true;
        this.authService.forgotPasswordSubmit(this.forgotPasswordForm.value.username, 
            this.verificationForm.value.verificationCode, this.verificationForm.value.password);
    }
}
