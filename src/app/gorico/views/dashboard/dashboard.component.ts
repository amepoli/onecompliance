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
    rows: number;
    columns: number;
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

    private labels = {
        'en': [ 
        ['probabilita', 'Rare', 'Unfrequent', 'Common', 'Sistematic'],
                ['impatto', 'Not relevant', 'Low', 'Medium', 'High', 'Catastrofic'],
                ['rischio_residuo', 'Not relevant', 'Low', 'Medium', 'High', 'Catastrofic'],
                ['rischio_inerente', 'Not relevant', 'Low', 'Medium low', 'Medium', 'Medium high', 'High', 'Catastrofic']
        ],
        'it': [ 
            ['probabilita', 'Raro', 'Infrequente', 'Comune', 'Sistematico'],
            ['impatto', 'Immateriale', 'Basso', 'Medio', 'Alto', 'Catastrofico'],
            ['rischio_residuo', 'Immateriale', 'Basso', 'Medio', 'Alto', 'Catastrofico'],
            ['rischio_inerente', 'Immateriale', 'Basso', 'Medio basso', 'Medio', 'Medio alto', 'Alto', 'Catastrofico']
        ]
    };

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
                    // recover the dashboard color codes
                    _this.backendService.getData(_this.tableParams.entryName, _this.tableParams.keys, null, false, false, _this.tableParams.entryIndex).subscribe(
                        colors => {
                            console.log(colors);
                            // now recover the dashboard data
                            _this.backendService.getData(_this.tableParams.entryName, _this.tableParams.keys, null, false, false, null).subscribe(
                                results => {
                                    console.log(results);
                                    results = _this.setOrder(results);
                                    const report = _this.setReport(viewResults, _this.tableParams.entryIndex, results, lang, colors);
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

    setOrder(data: any): any {
        const _this = this;
        data.forEach(element => {

            _this.labels[_this.traslateService.currentLang].forEach(entry => {
                const key = entry[0];  // get first entry (key)
                if (element[key] != null) {
                    let value = element[key];
                    value = _this.traslateService.get('DASHBOARDS.' + value);
                    value = value.value;  // WARNING: misusing the async observable, anyway it works!!!
                    // add leading number to entry value to get proper order in dashboard
                    for (let index = 1; index < entry.length; index++) {
                        if (value === entry[index]) {
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
        });
        return data;
    }

    setReport(data: any, data_index: number, source: any, language: any, colors: any[]): any {

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

        report.dataSource.data = source; // set the data source

        report.localization = language; // set the language

        // now set color of all cells
        if (report.conditions != null) {
            const model = report.conditions[0]; 
            // remove the sample condition
            report.conditions = [];
            const col_offset = (_this.tableParams.rows > 1) ? 1 : 0;
            let index = 0;
            for (let j = col_offset; j < _this.tableParams.columns + col_offset; j++) {
                for (let i = 2; i < _this.tableParams.rows + 2; i++) {
                    // distinguish between query retrieved and predefined colors
                    let color = colors[index] == null ? 'white' : colors[index].color != null ? colors[index].color : colors[index];
                    index++;
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

