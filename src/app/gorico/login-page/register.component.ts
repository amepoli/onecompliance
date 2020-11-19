import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { FuseConfigService } from '@fuse/services/config.service';
import { fuseAnimations } from '@fuse/animations';

import { AuthService } from './auth.service';

import { Router } from '@angular/router';
import { DialogService } from '../services/dialog.service';


@Component({
    selector: 'register',
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.scss'],
    animations: fuseAnimations
})
export class RegisterComponent implements OnInit, OnDestroy {
    registerForm: FormGroup;

    registering = false;
    registerButtonText = 'CREATE AN ACCOUNT';

    // Private
    private _unsubscribeAll: Subject<any>;

    constructor(
        private _fuseConfigService: FuseConfigService,
        private _formBuilder: FormBuilder,
        private router: Router,
        private authService: AuthService,
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

        this.router = router;

        // Set the private defaults
        this._unsubscribeAll = new Subject();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        this.registerForm = this._formBuilder.group({
            name: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required,
                Validators.pattern('(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[$@$!%*?&_])[A-Za-z\d$@$!%*?&_].{8,}')]],
            passwordConfirm: ['', [Validators.required, confirmPasswordValidator]]
        });

        this.authService.authStateChange$
            .subscribe(authState => {
                if (authState.state === 'sign-up') {
                    this._dialogService.closeDialog();
                    this.authService.setEmail(this.registerForm.get('email').value);
                    this.router.navigate(['/mail-confirm']);
                }
            });

        // Subscribe to Error EventEmitter in AuthService 
        this.authService.errorInfo$
            .subscribe(err => {
                this.registering = false;
                this.registerButtonText = "CREATE AN ACCOUNT";
                this._dialogService.showErrorDialog("Error", err.message ? err.message : "Invalid data");
                // console.log(`Signup Error: ${err}`);
                // console.table(err);
            });

        // Update the validity of the 'passwordConfirm' field
        // when the 'password' field changes

        this.registerForm.get('password').valueChanges
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(() => {
                this.registerForm.get('passwordConfirm').updateValueAndValidity();
            });


    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    onSubmit(): void {
        console.log(this.registerForm);
        this.authService.setUsername(this.registerForm.value.name);
        this.authService.setPassword(this.registerForm.value.password);
        this.authService.setEmail(this.registerForm.value.email);

        this.registerButtonText = "PLEASE WAIT";
        this.registering = true;
        // Show loading Alert
        this._dialogService.showLoadingDialog("Signing up", "Please wait...");
        this.authService.signUp();
    }
}

/**
 * Confirm password validator
 *
 * @param {AbstractControl} control
 * @returns {ValidationErrors | null}
 */
export const confirmPasswordValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {

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
