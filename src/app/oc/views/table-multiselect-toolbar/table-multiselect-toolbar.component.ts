import { SelectionModel } from '@angular/cdk/collections';
import { I } from '@angular/cdk/keycodes';
import { Component, Input, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, AfterViewInit, DoCheck, OnChanges } from '@angular/core';
import { MenuOption, SelectionAction, SelectionActionParams, TableViewKey } from 'app/oc/interfaces';
import { AuthService, BackendService, DialogService, ToastService } from 'app/oc/services';

import 'rxjs/add/operator/filter';
import { FormViewComponent } from '../form/form-view.component';

@Component({
    selector: 'table-multiselect-toolbar',
    templateUrl: './table-multiselect-toolbar.component.html',
    styleUrls: ['./table-multiselect-toolbar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableMultiselectToolbarComponent implements DoCheck {

    @Input("entryKey") entryKey: string;
    @Input("selection") selection: SelectionModel<any>;
    @Input("actions") actions: SelectionAction[];
    @Input("viewKeys") viewKeys: TableViewKey[];

    userCompanies: string[] = [];
    userdata: any;
    
    constructor(private _toastService: ToastService, private _dialogService: DialogService, private cdr: ChangeDetectorRef, private _authService: AuthService, private _backendService: BackendService) {
        // get user data after login
        this.userdata = this._authService.userinfo.getValue();
        
    }

    ngDoCheck() {
        this.cdr.detectChanges();
    }

    async performButtonAction(action: SelectionAction) {
        if(await this.isConfirmed(action)) {
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
                    
                    let selectionParams: SelectionActionParams = {
                        key: action.key,
                        viewType: 'button',
                        keys: {
                            selected_rows_primary_keys: params,
                            selected_rows_data: data
                        }
                    }
                    let subscription = this._backendService.runTableMultiSelectionActionQuery(this.entryKey, this._authService.getCurrentCompany(), selectionParams).subscribe(
                        result => {
                            if(result.result == 'OK') {
                                this._toastService.showSuccessToast('Success!');
                            }
                            else {
                                this._toastService.showErrorToast(result);
                            }
                            subscription.unsubscribe();
                            console.log(result);
                        },
                        error => {
                            this._toastService.showErrorToast(error);
                            subscription.unsubscribe();
                            console.error(error);
                        }
                    );
                    console.log(finalCondition);
                }
            }
        }
    }

    async performMenuAction(action: SelectionAction, menu: MenuOption) {
        if(await this.isConfirmed(menu)) {
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
                    
                    let selectionParams: SelectionActionParams = {
                        key: menu.key,
                        menuKey: action.key,
                        viewType: 'menu',
                        keys: {
                            selected_rows_primary_keys: params,
                            selected_rows_data: data
                        }
                    }
                    let subscription = this._backendService.runTableMultiSelectionActionQuery(this.entryKey, this._authService.getCurrentCompany(), selectionParams).subscribe(
                        result => {
                            if(result.result == 'OK') {
                                this._toastService.showSuccessToast('Success!');
                            }
                            else {
                                this._toastService.showErrorToast(result);
                            }
                            subscription.unsubscribe();
                            console.log(result);
                        },
                        error => {
                            subscription.unsubscribe();
                            console.error(error);
                        }
                    );
                    console.log(finalCondition);
                }
            }
        }
    }

    async isConfirmed(action: SelectionAction | MenuOption) {
        const _this = this;

        // Confirm first if confirmation is true before performing action
        if (action.confirmAction) {
            // Show confirmation dialog
            let result = await _this._dialogService.showConfimationDialog(action.confirmActionMessage, 'Are you sure you want to perform this action?', 'Yes', 'No', 'info');
            
            if (result && result.value === true) {
                return true;
            }
            else{
                return false;
            }
        }
        else {
            // No need for confirmation
            return true;
        }
    }
}
