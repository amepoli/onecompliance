import { Component, OnInit, Input } from '@angular/core';

export interface TabType  {
    label: string;
    name: string;
    keys: [];
}

@Component({
  selector: 'bottom-tabs',
  templateUrl: './bottom-tabs.component.html',
  styleUrls: ['./bottom-tabs.component.scss']
})
export class BottomTabsComponent implements OnInit {

@Input() Tabs: TabType[];

  constructor() { }

  ngOnInit() {
  }

}
