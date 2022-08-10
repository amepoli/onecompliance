import { Component, OnInit } from '@angular/core';

import { FuseConfigService } from '@fuse/services/config.service';
import { fuseAnimations } from '@fuse/animations';

import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { AuthService } from '../services';

@Component({
    selector   : 'mail-confirm',
    templateUrl: './mail-confirm.component.html',
    styleUrls  : ['./mail-confirm.component.scss'],
    animations : fuseAnimations
})
export class MailConfirmComponent implements OnInit
{
    insertCodeForm: UntypedFormGroup;

    email = 'user@example.com';
    username: string;
    codeOk  =  false;

    /**
     * Constructor
     *
     * @param {FuseConfigService} _fuseConfigService
     */
    constructor(
        private _fuseConfigService: FuseConfigService,
        private _authService: AuthService,
        private _formBuilder: UntypedFormBuilder
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
    ngOnInit(): void {
        this.email = this._authService.getEmail();
        this.username = this._authService.getUsername(); 

        this.insertCodeForm = this._formBuilder.group({
            code: ['', Validators.required]
        });

        this._authService.authStateChange$
            .subscribe(authState => {
                if (authState.state === 'confirm-sign-up') {
                    this.codeOk = true;
                }
            });
    }

    setEmail(email: string): void
    {
        this.email = email;
    }

    onSubmit(): void {
        this._authService.confirmSignUp(this.insertCodeForm.value.code);
    }
}
