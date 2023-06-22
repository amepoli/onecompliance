import { Component, Input, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, AfterViewInit, DoCheck, OnChanges, Output, EventEmitter } from '@angular/core';
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
export class MFAComponent implements OnInit, AfterViewInit {

    
    preferredMFA: string = '';
    subscriptions: Subscription[] = [];

    constructor(
        public mfaDialog: MatDialog,
        private _authService: AuthService,
        private _dialogService: DialogService,
        private _toastService: ToastService
        ) {
    }

    ngOnInit() {

    }
    
    ngAfterViewInit() {
        this.getMFAStatus();
    }
    
    enableMFA(){
        // this.onClick.emit(true);
        this.showMFADialog();
    }

    async disableMFA() {
        await this._authService.disableTOTP();
        this._dialogService.showSuccessDialog("Success", "Multi-factor Authentication has been disabled on your account. You might have to logout and login again to complete the process.");
        this.getMFAStatus();
    }

    showMFADialog() {
        const _this = this;

        // Pop-up example
        const dialogRef = _this.mfaDialog.open(MFADialogComponent, {
            width: '1280px',
            height: '620px',
            data: { entryName: 'TOTP', keys: {} }
        });

        _this.subscriptions.push(dialogRef.afterClosed().subscribe(result => {
            _this.getMFAStatus();
            if (result) {
            }
        }));
    }

    private async getMFAStatus() {
        const _this = this;
        _this.preferredMFA = await _this._authService.getMFAStatus();
    }

}
