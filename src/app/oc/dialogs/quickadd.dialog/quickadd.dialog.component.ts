import { Component, Inject, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy, ViewChildren, QueryList } from '@angular/core';
import { MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA, MatDialogRef as MatDialogRef } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { AuthService, AwsService, BackendService, ConsoleLoggerService, DialogService, EncryptionService, ToastService } from 'app/oc/services';

@Component({
    selector: 'app-quickadd.dialog',
    templateUrl: './quickadd.dialog.component.html',
    styleUrls: ['./quickadd.dialog.component.scss']
})



export class QuickAddDialogComponent implements OnInit, AfterViewInit, OnDestroy {
    
    constructor(
        public dialogRef: MatDialogRef<QuickAddDialogComponent>,
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
        // let _this = this;
        // _this.generateTOTPToken();
    }

    ngOnDestroy() {
        // this.subscriptions.forEach(subscription => {
        //     subscription.unsubscribe();
        // });
    }

    closeDialog() {
        this.dialogRef.close(null);
    }

    onEvent(e) {
        if(e.eventType === 'savedForm') {
            this.dialogRef.close(e);
        }
    }
    
}
