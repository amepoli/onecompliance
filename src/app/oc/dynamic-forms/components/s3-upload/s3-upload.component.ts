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

    onFileSelected(event: any) {
        const file = event.target.files[0];
        if (file) {
            this.uploadFileToS3(file);
        }
    }

    async uploadFileToS3(file: File) {
        this.isUploading = true;
        try {
            const base64File = await this.fileManagerService.convertFileToBase64(file);
            const requestBody = {
                bucketName: appData.lambdas.upload_to_s3.s3.bucket,
                fileName: file.name,
                fileBase64Data: base64File.split(',')[1],
            };

            // Costruisce dinamicamente l'URL dell'API Gateway basato su API Name
            const apiGatewayUrl = `https://api.onecompliance.cloud/${appData.lambdas.upload_to_s3.apiName}`;

            const response = await this.httpClient.post(apiGatewayUrl, requestBody).toPromise();

            if (response && (response as any).result === 'OK') {
                this.uploadedUrl = `s3://${requestBody.bucketName}/${requestBody.fileName}`;
                this.fileUploaded.emit(this.uploadedUrl);
                this.toastService.showSuccessToast('File uploaded successfully!');
            } else {
                throw new Error('Unexpected response from server');
            }
            // const keys = {
            //         nickname: _this.files[i].name,// _this.form.value.fileName != null ? _this.form.value.fileName : null,
            //         descrizione: _this.form.value.descrizione != null ? _this.form.value.descrizione : null,
            //         data_scadenza: _this.form.value.data_scadenza != null ? _this.form.value.data_scadenza : null,
            //         data_rif: _this.form.value.data_rif != null ? _this.form.value.data_rif : null,
            //         url: _this.form.value.url != null ? _this.form.value.url : null,
            //         descrizione_breve: _this.form.value.descrizione_breve != null ? _this.form.value.descrizione_breve : null,
            //         content_type: mime.lookup(_this.form.value.fileName),
            //         id_odg: _this.getValue(_this.form.value.id_odg), //_this.form.value.id_odg != null ? _this.form.value.id_odg.id : null,
            //         id_riunione: _this.getValue(_this.form.value.id_riunione), //_this.form.value.id_riunione != null ? _this.form.value.id_riunione.id : null,
            //         id_centro_gest: _this.getValue(_this.form.value.id_centro_gest), //_this.form.value.id_centro_gest != null ? _this.form.value.id_centro_gest.id : null,
            //         id_argomento_tipo_allegato: _this.getValue(_this.form.value.id_argomento_tipo_allegato), //_this.form.value.id_argomento_tipo_allegato != null ? _this.form.value.id_argomento_tipo_allegato.id : null,
            //         dimensione: _this.getValue(_this.form.value.dimensione), //_this.form.value.dimensione != null ? _this.form.value.dimensione : null,
            //         id_anagrafica: _this.getValue(_this.form.value.id_anagrafica), //_this.form.value.id_anagrafica != null ? _this.form.value.id_anagrafica.id : null,
            //         id_somministrazione: _this.getValue(_this.form.value.id_somministrazione), //_this.form.value.id_somministrazione != null ? _this.form.value.id_somministrazione.id : null,
            //         id_sondaggio: _this.getValue(_this.form.value.id_sondaggio), //_this.form.value.id_sondaggio != null ? _this.form.value.id_sondaggio.id : null,
            //         id_progetto: _this.getValue(_this.form.value.id_progetto), //_this.form.value.id_progetto != null ? _this.form.value.id_progetto.id : null,
            //         prog_revisione: _this.getValue(_this.form.value.prog_revisione), //_this.form.value.prog_revisione != null ? _this.form.value.prog_revisione.id : null,
            //         id_risorsa: _this.getValue(_this.form.value.id_risorsa), //_this.form.value.id_risorsa != null ? _this.form.value.id_risorsa.id : null,
            //         id_domanda: _this.getValue(_this.form.value.id_domanda), //_this.form.value.id_domanda != null ? _this.form.value.id_domanda.id : null,
            //         id_modello_test: _this.getValue(_this.form.value.id_modello_test), //_this.form.value.id_modello_test != null ? _this.form.value.id_modello_test.id : null,
            //         id_modello_test_vr: _this.getValue(_this.form.value.id_modello_test_vr), //_this.form.value.id_modello_test_vr != null ? _this.form.value.id_modello_test_vr.id : null,
            //         codice_compito: _this.getValue(_this.form.value.codice_compito), //_this.form.value.codice_compito != null ? _this.form.value.codice_compito.id : null,
            //         autore: _this.authService.getUsername(),
            //         businessObjectName: _this.data.businessObjectName
                
            // }
            // Step 1: Get Pre-Signed S3 URL from BackendService

            // const keys = {
            //     codice_azienda: this.authService.getCurrentCompany(),
            //     // id_somministrazione: "274",
            //     // id_sondaggio: "250",
            // };

            // const responseURL: any = await this.backendService.createFileURL(this.field.name,  this.authService.getCurrentCompany(), this.authService.getLastLanguage(), keys).toPromise();
            // if (responseURL && responseURL.result === 'OK') {
            //     // Step 2: Upload file to S3 using obtained URL
            //     await this.httpClient.put(responseURL.url, file).toPromise();
            //     this.uploadedUrl = responseURL.url;
            //     this.field.value = responseURL.url;
            //     this.group.get(this.field.name)?.setValue(responseURL.url);
            //     this.fileUploaded.emit(responseURL.url);
            // }
        } catch (error) {
            console.error('File upload failed', error);
            this.toastService.showErrorToast('File upload failed. Please try again.');
        } finally {
            this.isUploading = false;
        }
    }
}

