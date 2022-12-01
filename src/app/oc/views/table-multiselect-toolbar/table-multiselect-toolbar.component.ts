import { SelectionModel } from '@angular/cdk/collections';
import { I } from '@angular/cdk/keycodes';
import { Component, Input, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, AfterViewInit, DoCheck, OnChanges, Output, EventEmitter } from '@angular/core';
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

    @Output() onReload = new EventEmitter<any>();


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
        const _this = this;
        if(await _this.isConfirmed(action)) {
            if(_this.viewKeys) {
                const primaryKeys = _this.viewKeys.filter(entry => {
                    return entry.isPrimary;
                });
                if(primaryKeys.length > 0) {
                    let key_values = primaryKeys.map( x => x.key);
                    let params = key_values.join(" || '-' || ");
                    let dataRows = _this.selection.selected.map( s => {
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
                    let subscription = _this._backendService.runTableMultiSelectionActionQuery(_this.entryKey, _this._authService.getCurrentCompany(), selectionParams).subscribe(
                        result => {
                            if(result.result == 'OK') {
                                _this._toastService.showSuccessToast('Success!');
                                if(action.reloadOnSuccess) {
                                    _this.onReload.emit(true);
                                }
                            }
                            else {
                                _this._toastService.showErrorToast("Error ",JSON.stringify(result.reason.detail));
                            }
                            subscription.unsubscribe();
                        },
                        error => {
                            _this._toastService.showErrorToast("Error ",JSON.stringify(error));
                            subscription.unsubscribe();
                            console.error(error);
                        }
                    );
                }
            }
        }
    }

    async performMenuAction(action: SelectionAction, menu: MenuOption) {
        const _this = this;
        if(await _this.isConfirmed(menu)) {
            if(_this.viewKeys) {
                const primaryKeys = _this.viewKeys.filter(entry => {
                    return entry.isPrimary;
                });
                if(primaryKeys.length > 0) {
                    let key_values = primaryKeys.map( x => x.key);
                    let params = key_values.join(" || '-' || ");
                    let dataRows = _this.selection.selected.map( s => {
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
                    let subscription = _this._backendService.runTableMultiSelectionActionQuery(_this.entryKey, _this._authService.getCurrentCompany(), selectionParams).subscribe(
                        result => {
                            if(result.result == 'OK') {
                                _this._toastService.showSuccessToast('Success!');
                                if(menu.reloadOnSuccess) {
                                    _this.onReload.emit(true);
                                }
                            }
                            else {
                                _this._toastService.showErrorToast("Error ",JSON.stringify(result.reason.detail));
                            }
                            subscription.unsubscribe();
                        },
                        error => {
                            subscription.unsubscribe();
                            console.error(error);
                        }
                    );
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
