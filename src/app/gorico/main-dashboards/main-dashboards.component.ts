import { Component, OnInit } from '@angular/core';
import { BackendService } from '../views/backend/backend.service';

@Component({
  selector: 'app-main-dashboards',
  templateUrl: './main-dashboards.component.html',
  styleUrls: ['./main-dashboards.component.scss']
})
export class MainDashboardsComponent implements OnInit {

  keys: any;

  constructor(private backendService: BackendService) { }

  ngOnInit() {
    const _this = this;
    _this.keys = _this.backendService.globalTableKeys;
  }

}
