import { Component, OnInit } from '@angular/core';
import { BackendService } from '../views/backend/backend.service';
import { DashboardCellEvent } from '../views/dashboard/dashboard.component';

@Component({
  selector: 'app-main-dashboards',
  templateUrl: './main-dashboards.component.html',
  styleUrls: ['./main-dashboards.component.scss']
})
export class MainDashboardsComponent implements OnInit {

  keys: any;

  constructor(private backendService: BackendService) { }

  ngOnInit(): void {
    const _this = this;
    _this.keys = _this.backendService.globalTableKeys;
  }

  onCellClick(event: DashboardCellEvent): void{
    console.log(event);
    // set target table keys
    const keys = {};
    keys[event.columnLabel] = event.columnValue;
    keys[event.rowLabel] = event.rowValue;
    
  }

}
