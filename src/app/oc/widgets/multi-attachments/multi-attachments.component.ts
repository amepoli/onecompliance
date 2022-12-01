import { Component, Input, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, AfterViewInit, DoCheck, OnChanges, Output, EventEmitter } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { FileManagerService } from 'app/main/apps/file-manager/file-manager.service';
import { MultiAttachmentsDialogComponent } from 'app/oc/dialogs/multi-attachments.dialog/multi-attachments.dialog.component';
import { ActionsService, AuthService, BackendService, ConsoleLoggerService, DialogService, HelperService, ImportExportService, MessagesService, NavigationService, PubSubService, ReportService, TimezoneService, ToastService } from 'app/oc/services';
import { Subscription } from 'rxjs';

import 'rxjs/add/operator/filter';
import { FormViewComponent } from '../../views/form/form-view.component';

@Component({
    selector: 'multi-attachments',
    templateUrl: './multi-attachments.component.html',
    styleUrls: ['./multi-attachments.component.scss']
})
export class MultiAttachmentsComponent implements OnInit, AfterViewInit, OnChanges {

    @Input("entryName") entryName: string;    
    @Input("keys") keys: any;
    @Input("tooltip") tooltip: any;
    @Input("businessObjectName") businessObjectName: any;
                    
    @Output() onClick = new EventEmitter<boolean>();
    @Output() onSave: EventEmitter<boolean> = new EventEmitter<boolean>();

    
    numAttachments: number = 0;
    subscriptions: Subscription[] = [];

    constructor(
        public attachDialog: MatDialog,
        private backendService: BackendService,
        private authService: AuthService,
        private _dialogService: DialogService,
        private _toastService: ToastService,
        private _fileService: FileManagerService,
        private _pubSubService: PubSubService,
        private _reportService: ReportService,
        private _importExportService: ImportExportService,
        private _navigationService: NavigationService,
        private _messagesService: MessagesService,
        private _console: ConsoleLoggerService,
        private _actionsService: ActionsService,
        private _timezoneService: TimezoneService) {
    }

    ngOnInit() {

    }
    
    ngAfterViewInit() {
        this.getAttachList();
    }
    
    ngOnChanges(changes) {
        this.getAttachList();
    }

    performClick(){
        this.showMultiAttachments();
    }

    handleOnSave(_this = this, result: boolean) {
        _this.onSave.emit(result);
        // HelperService.refreshApp(result);
    }

    showMultiAttachments() {
        const _this = this;

        // Pop-up example
        const dialogRef = _this.attachDialog.open(MultiAttachmentsDialogComponent, {
            width: '1280px',
            data: { entryName: _this.entryName, keys: _this.keys, businessObjectName: this.businessObjectName}
        });

        _this.subscriptions.push(dialogRef.afterClosed().subscribe(result => {
            _this.getAttachList();
            _this.onSave.emit(result);
        }));
    }

    getAttachList() {
        const _this = this;
        //console.table(_this.keys);
        
        if(_this.keys && _this.entryName) {
                    const subscription = _this.backendService.getAttachList(_this.entryName, _this.authService.getCurrentCompany(_this.keys), _this.keys, _this.businessObjectName).subscribe(
            result => {
                _this._console.log(result);
                if (result.result === 'OK') {
                    let listFiles = result.list;
                    const files = [];
                    if (listFiles) {
                        _this.numAttachments = listFiles.length;
                        listFiles.forEach(element => {
                            const file = {
                                'name': element.client_file_name,
                                'type': 'document',
                                'owner': element.autore,
                                'size': _this._fileService.getFileSize(element.dimensione),
                                'modified': new Date(element.data_upd).toString(),
                                'opened': new Date(element.data_ins).toString(),
                                'created': new Date(element.data_creazione).toString(),
                                'extention': '',
                                'location': '',
                                'offline': true
                            };
                            files.push(file);
                        });
                    }
                    // _this._fileService.files = files;
                    // _this._fileService.getFiles();
                }
                else {
                    // Show error snackbar
                    _this._toastService.showErrorToast("Error ",JSON.stringify(result.reason.detail));
                }
            });
            _this.subscriptions.push(subscription);
        }
    }

}
