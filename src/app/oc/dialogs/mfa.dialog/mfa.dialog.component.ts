import { Component, Inject, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy, ViewChildren, QueryList } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { AuthService, AwsService, BackendService, ConsoleLoggerService, DialogService, EncryptionService, ToastService } from 'app/oc/services';

@Component({
    selector: 'app-mfa.dialog',
    templateUrl: './mfa.dialog.component.html',
    styleUrls: ['./mfa.dialog.component.scss']
})



export class MFADialogComponent implements OnInit, AfterViewInit, OnDestroy {

    subscriptions: Subscription[] = [];
    token: string = '';
    isLoading: boolean = true;
    verificationCode: string = '';
    curStep: number = 1;

    constructor(
        public dialogRef: MatDialogRef<MFADialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private _dialogService: DialogService,
        private _authService: AuthService,
        private _backendService: BackendService,
        private _awsService: AwsService,
        private _toastService: ToastService,
        private _console: ConsoleLoggerService) {
        
    }

    ngOnInit() {
    }

    ngAfterViewInit() {
        let _this = this;
        _this.generateTOTPToken();
    }

    ngOnDestroy() {
        this.subscriptions.forEach(subscription => {
            subscription.unsubscribe();
        });
    }

    gotoStep(step) {
        this.curStep = step;
    }

    async generateTOTPToken() {
        let _this = this;
        _this.isLoading = true;
        const token = await _this._authService.generateTOTPToken();
        _this.token = 
        "otpauth://totp/AWSCognito:"+ _this._authService.getUsername() + "?secret=" + token +
"&issuer=" + 'OneCompliance.cloud';
        _this.isLoading = false;
    }

    async verifyCode() {
        let _this = this;
        let result: any = await _this._authService.VerifyTotp(this.verificationCode);
        if(result.result === 'OK') {
            let mfaresult = await _this._backendService.enableMFA().toPromise();
            _this._dialogService.showSuccessDialog('Success', 'Multi-Factor Authentication successfully enabled on your account. You might have to logout and login again to complete the process.');
            _this.dialogRef.close(true);
        }
        else {
            _this._dialogService.showErrorDialog('Error', 'Multi-Factor Authentication could not be activated. Please try again.');
            _this.dialogRef.close(false);
        }
        // console.log(result);
    }
    
}
