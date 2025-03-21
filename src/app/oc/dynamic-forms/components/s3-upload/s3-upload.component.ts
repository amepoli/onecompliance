import { Component, Output, EventEmitter } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { BackendService } from '../../../../oc/services/backend.service';
import { FieldConfig } from 'app/oc/interfaces';
import { AuthService, ToastService } from 'app/oc/services';
import { FileManagerService } from 'app/main/apps/file-manager/file-manager.service';
import { environment } from 'environments/environment';

const appData = (environment.appData as any).default;

@Component({
    selector: 's3-upload',
    templateUrl: './s3-upload.component.html',
    styleUrls: ['./s3-upload.component.scss']
})
export class S3UploadComponent {
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

    onFileSelected(event: any): void {
        const file = event.target.files[0];
        if (file) {
            this.uploadFileToS3(file);
        }
    }

    async uploadFileToS3(file: File): Promise<void> {
        this.isUploading = true;
        try {
            const base64File = await this.fileManagerService.convertFileToBase64(file);
            const fileBase64Data = base64File.includes(',') ? base64File.split(',')[1] : base64File;

            const folderName = `mandati/${new Date().toISOString().replace(/[:.]/g, '-')}`;
            const bucketName = appData.lambdas.upload_to_s3.s3.bucket;
            const company = this.authService.getCurrentCompany();
            const dynamoUser = this.authService.getUsername();

            const putPostReq = {
                body: { fileBase64Data },
                headers: {},
                queryStringParameters: {
                    bucketName,
                    fileName: file.name,
                    folderName,
                    company,
                    dynamoUser
                }
            };

            console.log('>>> CHIAMATA ALLA LAMBDA upload_to_s3', {
                fileName: file.name,
                folderName,
                bucketName,
                fileBase64Data: fileBase64Data.substring(0, 30),
                company,
                dynamoUser
              });
              
              const response = await this.backendService.uploadFileToS3Wrapped(
                file.name, folderName, bucketName, fileBase64Data, company, dynamoUser
              );
              
              console.log('>>> RISPOSTA upload_to_s3', response);
              

            if (response?.result === 'OK') {
                const uploadedUrl = `s3://${bucketName}/${folderName}/${file.name}`;
                this.uploadedUrl = uploadedUrl;

                const fieldKey = (this.field as any).key ?? this.field.name;

                this.group.get(fieldKey)?.setValue(uploadedUrl);
                this.group.get(fieldKey + '_bucket')?.setValue(bucketName);
                this.group.get(fieldKey + '_folder')?.setValue(folderName);
                this.group.get(fieldKey + '_user')?.setValue(dynamoUser);

                this.fileUploaded.emit(uploadedUrl);
                this.toastService.showSuccessToast('File caricato con successo!');
            } else {
                throw new Error(response?.reason || 'Errore sconosciuto');
            }

        } catch (error) {
            console.error('Errore durante il caricamento file:', error);
            this.toastService.showErrorToast('Errore durante il caricamento');
        } finally {
            this.isUploading = false;
        }
    }
}
