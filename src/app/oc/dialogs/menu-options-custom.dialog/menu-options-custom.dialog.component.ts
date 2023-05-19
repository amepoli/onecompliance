import { Component, Inject, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy, ViewChildren, QueryList } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { AuthService, ConsoleLoggerService, DialogService, EncryptionService, ToastService } from 'app/oc/services';
import { FormGetterParams } from 'app/oc/interfaces';
import { FileManagerService } from 'app/main/apps/file-manager/file-manager.service';

@Component({
    selector: 'app-menu-options-custom.dialog',
    templateUrl: './menu-options-custom.dialog.component.html',
    styleUrls: ['./menu-options-custom.dialog.component.scss']
})



export class MenuOptionsCustomDialogComponent implements OnInit, AfterViewInit{

    title: string = "Undefined at the moment";
    formParams: FormGetterParams = null;
    subscriptions: Subscription[] = [];

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

            _this.formParams = {
                entryName: data.customDialogEntryName,
                keys: {
                    codice_azienda: _this._authService.getCurrentCompany()
                },
                isNew: true,
                isVisible: true
            };

            // let subscription = _this.fileService.onFileAdd.subscribe(result => {

                // // recover attachment types
                // for (const key in _this.data.keys) {
                //     if (_this.data.keys.hasOwnProperty(key)) {
                //         const element = _this.data.keys[key];
                //         _this.formParams.keys[key] = element;
                //     }
                // }
                // if (_this.formParams.keys.codice_azienda == null) { // hack, tipi_allegati requires this field
                //     _this.formParams.keys.codice_azienda = _this._authService.getCurrentCompany();
                //     //_this.newTypeParams.keys.codice_part;
                // }
                // _this.attach = true;
            // });
    
            // _this.subscriptions.push(subscription);

        
    }

    ngOnInit() {
    }

    ngAfterViewInit() {
        let _this = this;
        
    }

    

   
}
