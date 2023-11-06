import { Component, Input, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, AfterViewInit, DoCheck, OnChanges, Output, EventEmitter, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MFADialogComponent } from 'app/oc/dialogs/mfa.dialog/mfa.dialog.component';
import { AuthService, DialogService, ToastService } from 'app/oc/services';
import { Subscription } from 'rxjs';

import 'rxjs/add/operator/filter';

@Component({
    selector: 'mfa',
    templateUrl: './mfa.component.html',
    styleUrls: ['./mfa.component.scss']
})
export class MFAComponent implements OnInit, AfterViewInit, OnDestroy {

    
    preferredMFA: "SOFTWARE_TOKEN_MFA" | "NOMFA" | "" = '';
    subscriptions: Subscription[] = [];

    constructor(
        public mfaDialog: MatDialog,
        private _authService: AuthService,
        private _dialogService: DialogService,
        ) {
    }

    ngOnInit() {
        let _this = this;
        _this.subscriptions.push(_this._authService.authStateChange$.subscribe(authState => {
            console.log(authState);
            if(authState && authState.user) {
                _this.preferredMFA = authState.user.preferredMFA ?? "NOMFA";
            }
        }));
    }
    
    ngAfterViewInit() {
    }
    
    ngOnDestroy(): void {
        this.subscriptions.forEach(subscription => subscription.unsubscribe());
    }

    enableMFA(){
        // this.onClick.emit(true);
        this.showMFADialog();
    }

    async disableMFA() {
        let _this = this;
        _this._authService.disableTOTP().then(result => {
            if(result) {
                _this._authService.setUserMFA('NOMFA');
                _this.preferredMFA = 'NOMFA';
                _this._dialogService.showSuccessDialog("Success", "Multi-factor Authentication has been disabled on your account. You might have to logout and login again to complete the process.");
            }
            else {
                _this._dialogService.showErrorDialog("Error", "Error occured while setting the MFA!");
            }
        });
    }

    async showMFADialog() {
        const _this = this;

        // Pop-up example
        const dialogRef = _this.mfaDialog.open(MFADialogComponent, {
            width: '1280px',
            height: '620px',
            data: { entryName: 'TOTP', keys: {} }
        });

        _this.subscriptions.push(dialogRef.afterClosed().subscribe(result => {
            if(result) {
                _this.enableMFATotp();
            }
            else {
                _this._dialogService.showErrorDialog('Error', 'Multi-Factor Authentication could not be activated. Please try again.');
            }

        }));
    }

    private async enableMFATotp() {
        let _this = this;
        await _this._authService.enableMFA();
        _this._authService.setUserMFA('SOFTWARE_TOKEN_MFA');
        _this.preferredMFA = 'SOFTWARE_TOKEN_MFA';
        _this._dialogService.showSuccessDialog('Success', 'Multi-Factor Authentication successfully enabled on your account. You might have to logout and login again to complete the process.');
    }

}
