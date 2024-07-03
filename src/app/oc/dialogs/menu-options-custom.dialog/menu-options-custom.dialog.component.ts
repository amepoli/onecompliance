import { Component, Inject, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy, ViewChildren, QueryList } from '@angular/core';
import { MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA, MatDialogRef as MatDialogRef } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { AuthService, ConsoleLoggerService, DialogService, EncryptionService, ToastService } from 'app/oc/services';
import { FormGetterParams } from 'app/oc/interfaces';
import { FileManagerService } from 'app/main/apps/file-manager/file-manager.service';

@Component({
    selector: 'app-menu-options-custom.dialog',
    templateUrl: './menu-options-custom.dialog.component.html',
    styleUrls: ['./menu-options-custom.dialog.component.scss']
})



export class MenuOptionsCustomDialogComponent {

    title: string = "Dialog";
    formParams: FormGetterParams = null;
    subscriptions: Subscription[] = [];
    showSaveButton: boolean = false;

    constructor(
        public dialogRef: MatDialogRef<MenuOptionsCustomDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private _dialogService: DialogService,
        private _authService: AuthService,
        private _toastService: ToastService,
        private fileService: FileManagerService,
        private _console: ConsoleLoggerService) {
            const _this = this;
            _this.title = data.customDialogTitle;
            _this.showSaveButton = data.customDialogGenericSave ?? true;

            let keys = {
                codice_azienda: _this._authService.getCurrentCompany()
            };
            
            if(data.formKeys && Object.keys(data.formKeys).length > 0) {
                keys = {...keys, ...data.formKeys}
            }

            _this.formParams = {
                entryName: data.customDialogEntryName,
                keys: keys,
                isNew: false,
                isVisible: true
            };        
    }

    onEvent(event) {
        if(event.eventType === 'saved') {
            this.dialogRef.close(true);
        }
    }

}
