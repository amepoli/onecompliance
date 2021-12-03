import { SelectionModel } from '@angular/cdk/collections';
import { I } from '@angular/cdk/keycodes';
import { Component, Input, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, AfterViewInit, DoCheck, OnChanges } from '@angular/core';
import { SelectionAction, TableViewKey } from 'app/oc/interfaces';
import { AuthService } from 'app/oc/services';

import 'rxjs/add/operator/filter';
import { FormViewComponent } from '../form/form-view.component';

@Component({
    selector: 'table-multiselect-toolbar',
    templateUrl: './table-multiselect-toolbar.component.html',
    styleUrls: ['./table-multiselect-toolbar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableMultiselectToolbarComponent implements DoCheck {

    @Input("selection") selection: SelectionModel<any>;
    @Input("actions") actions: SelectionAction[];
    @Input("viewKeys") viewKeys: TableViewKey[];

    userCompanies: string[] = [];
    userdata: any;
    
    constructor(private cdr: ChangeDetectorRef, private _authService: AuthService) {
        // get user data after login
        this.userdata = this._authService.userinfo.getValue();
        
    }

    ngDoCheck() {
        this.cdr.detectChanges();
    }

    performButtonAction(key: string) {
        if(this.viewKeys) {
            const primaryKeys = this.viewKeys.filter(entry => {
                return entry.isPrimary;
            });
            if(primaryKeys.length > 0) {
                let key_values = primaryKeys.map( x => x.key);
                let params = key_values.join(" || '-' || ");
                let dataRows = this.selection.selected.map( s => {
                    return `'${key_values.map( key => s[key]).join('-')}'`;
                });
                let data = dataRows.join(',');
                let finalCondition = ` WHERE (${params}) IN (${data});`;
                console.log(finalCondition);
            }
        }
    }

    performMenuAction(key: string) {
        if(this.viewKeys) {
            const primaryKeys = this.viewKeys.filter(entry => {
                return entry.isPrimary;
            });
            if(primaryKeys.length > 0) {
                let key_values = primaryKeys.map( x => x.key);
                let params = key_values.join(" || '-' || ");
                let dataRows = this.selection.selected.map( s => {
                    return `'${key_values.map( key => s[key]).join('-')}'`;
                });
                let data = dataRows.join(',');
                let finalCondition = ` WHERE (${params}) IN (${data});`;
                console.log(finalCondition);
            }
        }
    }
}
