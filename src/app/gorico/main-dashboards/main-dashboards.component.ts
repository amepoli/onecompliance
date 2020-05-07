import { Component, OnInit } from '@angular/core';
import { BackendService } from '../views/backend/backend.service';
import { DashboardCellEvent } from '../views/dashboard/dashboard.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-main-dashboards',
  templateUrl: './main-dashboards.component.html',
  styleUrls: ['./main-dashboards.component.scss']
})
export class MainDashboardsComponent implements OnInit {

  keys: any;

  constructor(
      private backendService: BackendService,
      private router: Router) { }

  ngOnInit(): void {
    const _this = this;
    _this.keys = {};
  }

  onCellClick(event: DashboardCellEvent): void{
    const _this = this;
    console.log(event);
    // set target table keys
    const keys = {};
    if (event.columnLabel != null) {
        keys[event.columnLabel] = event.columnValue;
    }
    if (event.rowLabel != null) {
        keys[event.rowLabel] = event.rowValue;
    }
    _this.backendService.dashboardKeys = keys;
    const url = '/gorico/main-table/' + event.entryName;
    _this.router.navigate([url]);
  }

}
