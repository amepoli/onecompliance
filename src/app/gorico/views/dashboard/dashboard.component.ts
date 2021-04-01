import { Component, ViewChild, Input, Output, EventEmitter, AfterViewInit, OnDestroy } from '@angular/core';
import * as italiano from './it.json';
import { WebDataRocksPivot } from 'app/webdatarocks/webdatarocks.angular4';
import { BackendService } from '../backend/backend.service';
import { tableViewKey } from '../table/table-view.component';
import { AuthService } from 'app/gorico/login-page/auth.service';
import { ToastService } from 'app/gorico/services/toast.service';
import { ConsoleLoggerService } from 'app/gorico/services/console_logger.service';
import { ReportService } from 'app/gorico/services/report.service';
import { Subscription } from 'rxjs';


export interface DashboardParams {
    entryName: string;
    entryIndex: number; // in case of multiple dashboards for the same entry
    keys: any;
}

export interface DashboardCellEvent {
    entryName: string;
    row: number;
    column: number;
    rowLabel: string;
    rowValue: any;
    columnLabel: string;
    columnValue: any;
    cellValue: any;
}
@Component({
    selector: 'dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss']
})


export class DashboardComponent implements AfterViewInit, OnDestroy {

    constructor(private backendService: BackendService,
        private authService: AuthService,
        private _toastService: ToastService,
        private _console: ConsoleLoggerService,
        private _reportService: ReportService) { }

    @ViewChild('pivot1', { static: true }) child: WebDataRocksPivot;

    @Input() height = 500;
    @Input() viewHeader = false;
    @Input() tableParams: DashboardParams;

    @Output() cellClick = new EventEmitter<DashboardCellEvent>();

    subscriptions: Subscription[] = [];


    ngAfterViewInit(){
        this._reportService.getReports('dashboard', null, null, true);
    }

    ngOnDestroy() {
        this.subscriptions.forEach(element => {
            element.unsubscribe();
        });
    }
    
    onPivotReady(pivot: WebDataRocks.Pivot): void {
        this._console.log('pivot table ready');
    }

    onCustomizeCell(cell: WebDataRocks.CellBuilder, data: WebDataRocks.CellData): void {
        //console.log("[customizeCell] WebDataRocksPivot");
        if (data.isClassicTotalRow) cell.addClass('fm-total-classic-r');
        if (data.isGrandTotalRow) cell.addClass('fm-grand-total-r');
        if (data.isGrandTotalColumn) cell.addClass('fm-grand-total-c');
    }

    onReportComplete(): void {

        const _this = this;
        const lang = italiano;
        const company = _this.authService.getCurrentCompany();
        _this.child.webDataRocks.off('reportcomplete');

        const subscription = _this.backendService.getView(_this.tableParams.entryName, company, _this.tableParams.keys).subscribe(
            viewResults => {
                if (viewResults.result === 'OK' && viewResults.data.table_keys != null) {
                    viewResults = viewResults.data;
                    // keep only relevant global keys
                    _this.tableParams.keys = _this.getCurrentKeys(viewResults.table_keys, _this.tableParams.keys);
                    // recover the dashboard labels
                    const inner_subscription = _this.backendService.getData(_this.tableParams.entryName, _this.authService.getCurrentCompany(), _this.tableParams.keys, null, false, false, _this.tableParams.entryIndex, false).subscribe(
                        response => {
                            _this._console.log(response);
                            if (response.result === 'OK') {
                                const labels = response.data;
                                // now recover the dashboard data
                                const inner_subscription2 = _this.backendService.getData(_this.tableParams.entryName, _this.authService.getCurrentCompany(), _this.tableParams.keys, null, false, false, null, false).subscribe(
                                    results => {
                                        _this._console.log(results);
                                        if (results.result === 'OK') {
                                            if (results.data != null && results.data.table_data != null) {
                                                results.data = results.data.table_data;
                                            }
                                            results = _this.setOrder(results.data, labels);
                                            const report = _this.setReport(viewResults, _this.tableParams.entryIndex, results, lang, labels);
                                            _this.child.webDataRocks.setReport(report);
                                        }
                                        else {
                                            // Show error snackbar
                                            _this._toastService.showErrorToast(results.reason);
                                        }
                                    });
                                _this.subscriptions.push(inner_subscription2);
                            }
                            else {
                                // Show error snackbar
                                _this._toastService.showErrorToast(response.reason);
                            }
                        }, error => {
                            // Error occured!
                            _this._toastService.showErrorToast("An error occured!", error);

                        });

                    _this.subscriptions.push(inner_subscription);
                }
                else {
                    // Show error snackbar
                    _this._toastService.showErrorToast(viewResults.reason);
                }
            });

        _this.subscriptions.push(subscription);
    }

    getCurrentKeys(validKeysArray: tableViewKey[], inputKeys: any): any {

        const outputKeys = {};
        for (const key in inputKeys) {
            if (inputKeys.hasOwnProperty(key)) {
                const element = inputKeys[key];
                if (validKeysArray.find(e => e.key === key)) {
                    outputKeys[key] = element;
                }
            }
        }

        return outputKeys;
    }

    onCellDoubleClick(cell: WebDataRocks.CellData): void {
        const _this = this;
        let rowValue, columnValue;
        // reverse labels and values to get original fields and values
        let rowLabel = cell.rows[0];
        if (rowLabel != null) {
            rowLabel = rowLabel.hierarchyUniqueName;
            rowLabel = rowLabel.charAt(0).toLowerCase() + rowLabel.substring(1);
            rowValue = cell.rows[0].caption.split('. ')[1];
        }
        let columnLabel = cell.columns[0];
        if (columnLabel != null) {
            columnLabel = columnLabel.hierarchyUniqueName;
            columnLabel = columnLabel.charAt(0).toLowerCase() + columnLabel.substring(1);
            columnValue = cell.columns[0].caption.split('. ')[1];
        }
        // set event
        const eventData: DashboardCellEvent = {
            entryName: _this.tableParams.entryName,
            row: cell.rowIndex,
            column: cell.columnIndex,
            cellValue: cell.value,
            rowLabel: rowLabel,
            columnLabel: columnLabel,
            rowValue: rowValue,
            columnValue: columnValue
        };
        _this.cellClick.emit(eventData);
    }

    setOrder(data: any, labels: any): any {
        const _this = this;

        const columnArray = labels.columns != null ? labels.columns.data.map(c => c.label) : [];
        const rowArray = labels.rows != null ? labels.rows.data.map(c => c.label) : [];
        // filter out not codified elements
        data = data.filter(d =>
            (labels.columns == null || (labels.columns != null && d[labels.columns.key] != null && columnArray.indexOf(d[labels.columns.key]) !== -1))
            && (labels.rows == null || (labels.rows != null && d[labels.rows.key] != null && rowArray.indexOf(d[labels.rows.key]) !== -1)));
        const rowLabels = [];
        const columnLabels = [];
        data.forEach(element => {
            if (labels.columns != null) {
                if (columnLabels.indexOf(element[labels.columns.key]) === -1) {
                    columnLabels.push(element[labels.columns.key]);
                }
            }
            if (labels.rows != null) {
                if (rowLabels.indexOf(element[labels.rows.key]) === -1) {
                    rowLabels.push(element[labels.rows.key]);
                }
            }
        });
        if (labels.columns != null && columnLabels.length !== columnArray.length && labels.colors.type === 'column') { // missing column labels in dataset
            columnArray.forEach(label => {
                if (columnLabels.indexOf(label) === -1) { // missing column
                    // remove related color to keep the right colorset
                    const index = columnArray.indexOf(label);
                    labels.colors.colors.splice(index, 1);
                }
            });
        }
        if (labels.rows != null && rowLabels.length !== rowArray.length && labels.colors.type === 'row') {
            rowArray.forEach(label => {
                if (rowLabels.indexOf(label) === -1) { // missing row
                    // remove related color to keep the right colorset
                    const index = columnArray.indexOf(label);
                    labels.colors.colors.splice(index, 1);
                }
            });
        }
        // finally set the order
        data.forEach(element => {
            if (labels.columns != null && element[labels.columns.key] != null) {
                const key = labels.columns.key;
                let value = element[key];
                // add leading number to entry value to get proper order in dashboard
                for (let index = 0; index < columnArray.length; index++) {
                    if (value === columnArray[index]) {
                        value = index + 1 + '. ' + value;
                        break;
                    }
                }
                // rename the entry using capital letter
                const newKey = key.charAt(0).toUpperCase() + key.substring(1);
                element[newKey] = value;
                delete element[key];
            }
            if (labels.rows != null && element[labels.rows.key] != null) {
                const key = labels.rows.key;
                let value = element[key];
                // add leading number to entry value to get proper order in dashboard
                for (let index = 0; index < rowArray.length; index++) {
                    if (value === rowArray[index]) {
                        value = index + 1 + '. ' + value;
                        break;
                    }
                }
                // rename the entry using capital letter
                const newKey = key.charAt(0).toUpperCase() + key.substring(1);
                element[newKey] = value;
                // note that is is just deleted if not codified
                delete element[key];
            }
        });
        return data;
    }

    setReport(data: any, data_index: number, source: any, language: any, labels: any): any {

        const _this = this;

        const LUTColors = {
            white: '#FFFFFF',
            black: '#000000',
            red: '#FF0000',
            green: '#008000',
            yellow: '#FFD700',
            orange: '#FF8C00',
            blue: '#0000FF'
        }
        const report = data.dashboards[data_index];

        if (report == null) {
            return null;
        }

        const numColumns = labels.columns == null ? 1 : labels.columns.data.length;
        const numRows = labels.rows == null ? 1 : labels.rows.data.length;

        report.dataSource.data = source; // set the data source

        report.localization = language; // set the language

        // now set color of all cells

        const colors = labels.colors.colors;
        const colorsType = labels.colors.type;

        if (report.conditions != null) {
            const model = report.conditions[0];
            // remove the sample condition
            report.conditions = [];
            const col_offset = (numRows > 1) ? 1 : 0;
            let index = 0;
            for (let j = col_offset; j < numColumns + col_offset; j++) {
                for (let i = 2; i < numRows + 2; i++) {
                    // get the right color, depending on type
                    let color = 'white';
                    if (colorsType === 'full') {
                        color = colors[index] == null ? 'white' : colors[index].color;
                        index++;
                    } else if (colorsType === 'column') {
                        color = colors[j - col_offset] == null ? 'white' : colors[j - col_offset].color;
                    } else if (colorsType === 'row') {
                        color = colors[i - 2] == null ? 'white' : colors[i - 2].color;
                    }
                    const item = JSON.parse(JSON.stringify(model)); // copy the object
                    if (color.charAt(0) !== '#') {  // remove capital leading char if not already as hex
                        color = color.charAt(0).toLowerCase() + color.substring(1);
                    }
                    item['row'] = i;
                    item['column'] = j;
                    const dualColor = (color === 'yellow' || color === 'white' || color === 'orange')
                        ? '#000000' // black
                        : '#FFFFFF'; // white
                    item.format.backgroundColor = color.charAt(0) === '#' ? color : LUTColors[color];
                    item.format.color = dualColor;
                    report.conditions.push(item);
                }
            }
        }

        return report;
    }

}

