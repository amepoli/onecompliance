import { Component, OnInit } from '@angular/core';
import { AbstractControl, UntypedFormBuilder, UntypedFormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';

import { FuseConfigService } from '@fuse/services/config.service';
import { fuseAnimations } from '@fuse/animations';
import { AuthService, DialogService, ToastService } from '../services';
import { Router } from '@angular/router';
import { ChallengeNameType } from '@aws-sdk/client-cognito-identity-provider';

@Component({
    selector   : 'change-password',
    templateUrl: './change-password.component.html',
    styleUrls  : ['./change-password.component.scss'],
    animations : fuseAnimations
})
export class ChangePasswordComponent implements OnInit
{
    changePasswordForm: UntypedFormGroup;

    verificationForm: UntypedFormGroup;

    emailSent = false;

    passwordReset = false;

    hide = true;

    // Url used to return to after successfully logging in
    returnUrl = '/oc/homepage';

    /**
     * Constructor
     *
     * @param {FuseConfigService} _fuseConfigService
     * @param {FormBuilder} _formBuilder
     */
    constructor(
        private _fuseConfigService: FuseConfigService,
        private _formBuilder: UntypedFormBuilder,
        private _router: Router,
        private _authService: AuthService,
        private _dialogService: DialogService,
        private _toastService: ToastService
    )
    {
        // Configure the layout
        this._fuseConfigService.resetToDefaults();
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
        const session = this._authService.authStateChange$.value?.session ?? null;
        if(session && session.ChallengeName === ChallengeNameType.NEW_PASSWORD_REQUIRED) {
            // user can change password
        }
        else {
            this._router.navigate(['/login']);
        }

        // ChallengeName: 'PasswordResetRequiredException',
        // USERNAME: username

        this.changePasswordForm = this._formBuilder.group({
            password: ['', [Validators.required,
                Validators.pattern('(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[$@$!%*?&_])[A-Za-z\d$@$!%*?&_].{8,}')]],
            passwordConfirm: ['', [Validators.required, confirmPasswordValidator]]
        });

        // subscribe to backend retrieval of user info
        this._authService.userinfo.subscribe(info => {
            if (info && info.username != null) {
                // got info from backend, now we can proceed
                this._authService.setUsername(info.username);
                this._router.navigate([this.returnUrl]);
            }
        }, error => {
            // Error occured!
        });
    }

    onSubmit(event) {
        event.preventDefault();
        let _this = this;
        if(_this.changePasswordForm.value.password.length > 0 &&
            _this.changePasswordForm.value.passwordConfirm.length > 0 && 
            _this.changePasswordForm.value.password === _this.changePasswordForm.value.passwordConfirm) {
                // Show loading Alert
                _this._dialogService.showLoadingDialog("Signing in", "Please wait...");

                _this._authService.changePassword(
                    _this.changePasswordForm.value.password,
                    ).then(result => {
                        _this._dialogService.closeDialog();
                        if(result) {
                            _this._router.navigate([_this.returnUrl]);
                        }
                        else {
                            _this._toastService.showErrorToast("Error occured while setting password!");
                        }
                    }).catch(e => {
                        // Error occured!
                        _this._dialogService.closeDialog();
                        _this._toastService.showErrorToast("Error occured while setting password!");
                        console.log(e);
                    });
            }
    }

    // onSubmitCode(): void {
    //     this.emailSent = false;
    //     this.passwordReset = true;
    //     this.authService.changePasswordSubmit(this.changePasswordForm.value.username, 
    //         this.verificationForm.value.verificationCode, this.verificationForm.value.password);
    // }



}



/**
 * Confirm password validator
 *
 * @param {AbstractControl} control
 * @returns {ValidationErrors | null}
 */
const confirmPasswordValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {

    if (!control.parent || !control) {
        return null;
    }

    const password = control.parent.get('password');
    const passwordConfirm = control.parent.get('passwordConfirm');

    if (!password || !passwordConfirm) {
        return null;
    }

    if (passwordConfirm.value === '') {
        return null;
    }

    if (password.value === passwordConfirm.value) {
        return null;
    }

    return { 'passwordsNotMatching': true };
};