import { Component, ViewChild, Input, Output, EventEmitter } from '@angular/core';
import * as italiano from './it.json';
import { WebDataRocksPivot } from 'app/webdatarocks/webdatarocks.angular4.js';
import { BackendService } from '../backend/backend.service';
import { tableViewKey } from '../table/table-view.component';
import { _MatChipListMixinBase } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';


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


export class DashboardComponent {

    constructor(private backendService: BackendService,
                private traslateService: TranslateService) { }

    @ViewChild('pivot1') child: WebDataRocksPivot;

    @Input() height = 500;
    @Input() viewHeader = false;
    @Input() tableParams: DashboardParams;

    @Output() cellClick = new EventEmitter<DashboardCellEvent>();

    onPivotReady(pivot: WebDataRocks.Pivot): void {
        console.log('pivot table ready');
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
        _this.child.webDataRocks.off('reportcomplete');

        _this.backendService.getView(_this.tableParams.entryName).subscribe(
            viewResults => {
                if (viewResults.table_keys != null) {
                    // keep only relevant global keys
                    _this.tableParams.keys = _this.getCurrentKeys(viewResults.table_keys, _this.tableParams.keys);
                    // recover the dashboard labels
                    _this.backendService.getData(_this.tableParams.entryName, _this.tableParams.keys, null, false, false, _this.tableParams.entryIndex).subscribe(
                        labels => {
                            console.log(labels);
                            // now recover the dashboard data
                            _this.backendService.getData(_this.tableParams.entryName, _this.tableParams.keys, null, false, false, null).subscribe(
                                results => {
                                    console.log(results);
                                    results = _this.setOrder(results, labels);
                                    const report = _this.setReport(viewResults, _this.tableParams.entryIndex, results, lang, labels);
                                    _this.child.webDataRocks.setReport(report);
                                });
                        });
                }
            });
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
        }
        _this.cellClick.emit(eventData);
    }

    setOrder(data: any, labels: any): any {
        const _this = this;
        data.forEach(element => {
            if (labels.columns != null && element[labels.columns.key] != null) {
                const key = labels.columns.key;
                let value = element[key];
                // add leading number to entry value to get proper order in dashboard
                for (let index = 0; index < labels.columns.length; index++) {
                    if (value === labels.columns.data[index]) {
                        value = index + '. ' + value;
                        break;
                    }
                }
                // rename the entry using capital letter
                const newKey = key.charAt(0).toUpperCase() + key.substring(1);
                element[newKey] = value;
                delete element[key];
            } else if (labels.rows != null && element[labels.rows.key] != null) {
                const key = labels.rows.key;
                let value = element[key];
                // add leading number to entry value to get proper order in dashboard
                for (let index = 0; index < labels.rows.length; index++) {
                    if (value === labels.rows.data[index]) {
                        value = index + '. ' + value;
                        break;
                    }
                }
                // rename the entry using capital letter
                const newKey = key.charAt(0).toUpperCase() + key.substring(1);
                element[newKey] = value;
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
                        color = colors[index] == null ? 'white' : colors[index];
                        index++;
                    } else if (colorsType === 'column') {
                        color = colors[j - col_offset] == null ? 'white' : colors[j - col_offset];
                    } else if (colorsType === 'row') {
                        color = colors[i - 2] == null ? 'white' : colors[i - 2];
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

