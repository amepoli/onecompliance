import { Component, ViewChild, Input } from '@angular/core';
import * as italiano from './it.json';
import { WebDataRocksPivot } from 'app/webdatarocks/webdatarocks.angular4.js';
import { BackendService } from '../backend/backend.service';
import { tableViewKey } from '../table/table-view.component';


export interface DashboardParams {
    entryName: string;
    keys: any;
}
@Component({
    selector: 'dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss']
})


export class DashboardComponent {

    constructor(private backendService: BackendService) { }

    @ViewChild('pivot1') child: WebDataRocksPivot;

    @Input() height = 500;
    @Input() viewHeader = false;
    @Input() tableParams: DashboardParams;

    private labels = [
        ['probabilita', 'Rare', 'Unfrequent', 'Common', 'Sistematic'],
        ['impatto', 'Immaterial', 'Low', 'Medium', 'High', 'Catastrofic']
    ];

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
                    _this.backendService.getData(_this.tableParams.entryName, _this.tableParams.keys, null, false, false).subscribe(
                        results => {
                            console.log(results);
                            results = _this.setOrder(results);
                            const report = _this.setReport(viewResults, results, lang);
                            _this.child.webDataRocks.setReport(report);
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
        alert('Cella - riga:' + cell.rowIndex + ' colonna:' + cell.columnIndex + ' valore:' + cell.value);
    }

    setOrder(data: any): any {
        const _this = this;
        data.forEach(element => {
            _this.labels.forEach(entry => {
                let key = entry[0];
                if (element[key] != null) {
                    let value = element[entry[0]];
                    // add leading number to entry value to get proper order in dashboard
                    for (let index = 1; index < entry.length; index++) {
                        if (value === entry[index]) {
                            value = index + '. ' + value;
                            break;
                        }
                    }
                    // rename the entry using capital letter
                    let newKey = key.charAt(0).toUpperCase() + key.substring(1);
                    element[newKey] = value;
                    delete element[key];
                }
            });
        });
        return data;
    }

    setReport(data: any, source: any, language: any): any {

        const LUTColors = {
            white:  '#FFFFFF',
            black:  '#000000',
            red:    '#FF0000',
            green:  '#008000',
            yellow: '#FFD700',
            orange: '#FF8C00'
        }
        const report = data.dashboard;

        if (report == null) {
            return null;
        }

        report.dataSource.data = source; // set the data source

        report.localization = language; // set the language

        // now replace colors labels with hex values
        if (report.conditions != null) {
            report.conditions.forEach(element => {
                if (element.format != null) {
                    if (element.format.backgroundColor != null) {
                        const colorString = element.format.backgroundColor;
                        element.format.backgroundColor = LUTColors[colorString];
                    }
                    if (element.format.color != null) {
                        const colorString = element.format.color;
                        element.format.color = LUTColors[colorString];
                    }
                }
            });
        }

        return report;
    }

}

