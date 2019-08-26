import { Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FileManagerService } from 'app/main/apps/file-manager/file-manager.service';

@Component({
  selector: 'app-attach.dialog',
  templateUrl: './attach.dialog.component.html',
  styleUrls: ['./attach.dialog.component.scss']
})



export class AttachDialogComponent {

  attach: boolean;

  progress: number;

  form: FormGroup;

  constructor(private _formBuilder: FormBuilder,
    public dialogRef: MatDialogRef<AttachDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public fileService: FileManagerService) { 

        
  /*      this.tableService.getAttachList(data.table, data.keys, data.company).subscribe(
            results => {
                console.log(results);
            });
  */      

        // Reactive Form
        this.form = this._formBuilder.group({
            id   : [
                {
                    value   : 24,
                    disabled: true
                }, Validators.required
            ],
            nomeFile  : ['', Validators.required],
            dimensione   : [
                {
                    value: 0,
                    disabled: true
                }, Validators.required
            ],
            docURL    : [''],
            descBreve : [''],
            descrizione  : [''],
            tipo   : ['']
        });

        this.fileService.onFileAdd.subscribe(result => {
            this.attach = true;
        });

        this.attach = false;

        this.progress = 0;
    }

    onSave(): void {
        this.attach = false;
    }
    

}
