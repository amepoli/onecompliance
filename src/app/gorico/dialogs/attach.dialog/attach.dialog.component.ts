import { Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import { GenericTableService } from 'app/gorico/generic-table/generic-table.service';
import { FieldConfig } from 'app/gorico/dynamic-forms/field.interface';

@Component({
  selector: 'app-attach.dialog',
  templateUrl: './attach.dialog.component.html',
  styleUrls: ['./attach.dialog.component.scss']
})
export class AttachDialogComponent {

  regConfig_it: FieldConfig[] = [];

  constructor(public dialogRef: MatDialogRef<AttachDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public tableService: GenericTableService) { 
        this.tableService.getData('/' + this.data.table, this.data.keys, 'attach').subscribe(
            results => {
                console.log(results);
            });
    }

    onAttach(): void {
        this.dialogRef.close();
      }
    

}
