import { Component, Inject, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy, ViewChildren, QueryList } from '@angular/core';
import { MAT_DIALOG_DATA as MAT_DIALOG_DATA, MatDialogRef as MatDialogRef } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { AuthService, ConsoleLoggerService, DialogService, EncryptionService, ToastService } from 'app/oc/services';
import { DataSharingService } from 'app/oc/services/data_sharing.service';
import { Router } from '@angular/router';

@Component({
    selector: 'calendar-event.dialog',
    templateUrl: './calendar-event.dialog.component.html',
    styleUrls: ['./calendar-event.dialog.component.scss']
})



export class CalendarEventDialogComponent implements OnInit, AfterViewInit, OnDestroy {

    subscriptions: Subscription[] = [];
    isLoading: boolean = false;
    
    constructor(
        public dialogRef: MatDialogRef<CalendarEventDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private _dialogService: DialogService,
        private _authService: AuthService,
        private _toastService: ToastService,
        private _console: ConsoleLoggerService,
        private _dataSharingService: DataSharingService,
        private router: Router) {
        
    }

    ngOnInit() {
    }

    ngAfterViewInit() {
    }

    ngOnDestroy() {
        this.subscriptions.forEach(subscription => {
            subscription.unsubscribe();
        });
    }

    gotoObject() {
        this._dataSharingService.setData('homepageSearchKeys', this.data.object_id);
        this.router.navigate([`/oc/main-table/${this.data.object_name}`]);
        this.dialogRef.close();
        
    }
    
}
