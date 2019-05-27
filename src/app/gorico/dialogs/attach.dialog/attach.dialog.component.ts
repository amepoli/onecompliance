import { Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import { GenericTableService } from 'app/gorico/generic-table/generic-table.service';
import { FieldConfig } from 'app/gorico/dynamic-forms/field.interface';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-attach.dialog',
  templateUrl: './attach.dialog.component.html',
  styleUrls: ['./attach.dialog.component.scss']
})

export class AttachDialogComponent {

  attach = false;

  progress = 0;

  form: FormGroup;

  constructor(private _formBuilder: FormBuilder,
    public dialogRef: MatDialogRef<AttachDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public tableService: GenericTableService) { 

        this.tableService.getData('/' + this.data.table, this.data.keys, 'attach').subscribe(
            results => {
                console.log(results);
            });

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
    }

    onAttach(): void {
        this.attach = true;
      }

    onSave(): void {
        this.attach = false;
    }
    

}
