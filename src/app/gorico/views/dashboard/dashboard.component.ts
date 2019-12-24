import { Component, ViewChild } from '@angular/core';
import * as italiano from './it.json';
import { WebDataRocksPivot } from 'app/webdatarocks/webdatarocks.angular4.js';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {

  constructor() { }

  @ViewChild('pivot1') child: WebDataRocksPivot;

  onPivotReady(pivot: WebDataRocks.Pivot): void {
        console.log('pivot table ready');
    }

  onCustomizeCell(cell: WebDataRocks.CellBuilder, data: WebDataRocks.CellData): void {
      //console.log("[customizeCell] WebDataRocksPivot");
      if (data.isClassicTotalRow) cell.addClass("fm-total-classic-r");
      if (data.isGrandTotalRow) cell.addClass("fm-grand-total-r");
      if (data.isGrandTotalColumn) cell.addClass("fm-grand-total-c");
    }

  onReportComplete(): void {


    const lang = italiano;
    this.child.webDataRocks.off('reportcomplete');
    this.child.webDataRocks.setReport({
      dataSource: {
        filename: 'https://cdn.webdatarocks.com/data/data.json'
      },
      options: {
        drillThrough: false,
        grid: {
          showHeaders: false
        }
      },
      localization: lang,
      conditions: [
        {
            formula: '!isNaN(#value)',
            format: {
                backgroundColor: '#FF9800',
                color: '#000000',
                fontFamily: 'Arial',
                fontSize: '12px'
            },
            row: 2,
            column: 1
        }
    ],
     slice: {
        rows: [
            {
                uniqueName: 'Category'
            }
        ],
        columns: [
            {
                uniqueName: 'Measures'
            },
            {
                uniqueName: 'Country'
            }
        ],
        measures: [
            {
                uniqueName: 'Price',
                aggregation: 'sum'
            }
        ]
      }
    });
    }

  onCellDoubleClick(cell: WebDataRocks.CellData): void {
    alert('Cella - riga:' + cell.rowIndex + ' colonna:' + cell.columnIndex + ' valore:' + cell.value);
  }
}

