import { Component, Output, EventEmitter } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { BackendService } from '../../../../oc/services/backend.service';
import { FieldConfig, TextractFile } from 'app/oc/interfaces';
import { AuthService, ToastService } from 'app/oc/services';
import { FileManagerService } from 'app/main/apps/file-manager/file-manager.service';
import { environment } from 'environments/environment';

const appData = (environment.appData as any).default;

@Component({
    selector: 'textract',
    templateUrl: './textract.component.html',
    styleUrls: ['./textract.component.scss']
})
export class TextractComponent {
    field: FieldConfig;
    group: UntypedFormGroup;
    @Output() fileUploaded = new EventEmitter<string>();

    isUploading: boolean = false;
    uploadedUrl: string | null = null;

    constructor(
        private backendService: BackendService,
        private toastService: ToastService,
        private authService: AuthService,
        private httpClient: HttpClient,
        private fileManagerService: FileManagerService
    ) {}

    onFileSelected(event: any) {
        const files = event.target.files;
        this.isUploading = true;
        if (files && files.length > 0) {
            this.performOperation(files);
        }
        this.isUploading = false;
    }

    async performOperation(files: FileList) {

        const loadingToastId = this.toastService.showLoadingToast('Uploading', 'Uploading files to Textract...');

        let fileList: TextractFile[] = [];

        for(const file in files) {
            if (file) {
                fileList.push({
                    filename: files[file].name,
                    fileBase64Data: await this.fileManagerService.convertFileToBase64(files[file])
                });
            }            
        }

        this.backendService.uploadUsingTextract(this.authService.getCurrentCompany(), 'test', fileList).subscribe(
        (response: any) => {
            console.log(response);
            this.toastService.hideLoadingToast(loadingToastId);
        },
        (error) => {
            console.log(error);
            this.toastService.hideLoadingToast(loadingToastId);
        });
    }

}

