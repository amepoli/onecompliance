import { Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import { GenericTableService } from 'app/gorico/generic-table/generic-table.service';
import { FieldConfig } from 'app/gorico/dynamic-forms/field.interface';

@Component({
  selector: 'app-add.dialog',
  templateUrl: './add.dialog.component.html',
  styleUrls: ['./add.dialog.component.scss']
})
export class AddDialogComponent {

  regConfig_it: FieldConfig[] = [];

  constructor(public dialogRef: MatDialogRef<AddDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public tableService: GenericTableService) { 
        this.tableService.getData('/' + this.data.table, this.data.keys, 'create').subscribe(
            results => {
                const son_keys = [];
                const values = [];
                const sub_keys = data['sub_keys'];
                // tslint:disable-next-line:forin
                for (const key in sub_keys) {
                    son_keys.push(sub_keys[key]['son']);
                    values.push(sub_keys[key]['value']);
                }
                results.forEach(element => {
                    const idx = son_keys.indexOf(element['name']);
                    if (idx >= 0) {
                        element['value'] = values[idx];
                        element['readonly'] = true;
                    }
                });
                this.tableService.process_form(results);
                this.regConfig_it = results;
                console.log(results);
            });
    }

    onClose(): void {
        this.dialogRef.close();
      }
    

}
