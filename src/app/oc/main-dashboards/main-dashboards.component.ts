import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DashboardCellEvent } from '../interfaces';
import { AuthService, BackendService } from '../services';

@Component({
  selector: 'app-main-dashboards',
  templateUrl: './main-dashboards.component.html',
  styleUrls: ['./main-dashboards.component.scss']
})
export class MainDashboardsComponent implements OnInit {

  keys: any;
  tables: string[];
  dashboardData = {};

  constructor(
      private backendService: BackendService,
      private router: Router,
      private route: ActivatedRoute,
      private authService: AuthService) { }

  ngOnInit(): void {
    const _this = this;
    _this.keys = {};
    _this.route.paramMap
    .subscribe(params => {
      const tables = params.get('table');
      _this.tables = tables.split(',');
      _this.tables.forEach(table => {
      const subscription = _this.backendService.getView(table, _this.authService.getCurrentCompany(null), {}).subscribe(
        result => {
            if (result.result === 'OK' && result.data != null) {
                const data = result.data;
                _this.dashboardData[table] = data.dashboards;
            }
        });
        });
    });
  }

  onCellClick(event: DashboardCellEvent): void{
    const _this = this;
    // console.log(event);
    // set target table keys
    const keys = {};
    if (event.columnLabel != null) {
        keys[event.columnLabel] = event.columnValue;
    }
    if (event.rowLabel != null) {
        keys[event.rowLabel] = event.rowValue;
    }
    _this.backendService.dashboardKeys = keys;
    const url = '/oc/main-table/' + event.entryName;
    _this.router.navigate([url]);
  }

}
