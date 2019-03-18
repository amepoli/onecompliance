import { Component, OnInit, Input } from '@angular/core';
import { MatTabChangeEvent } from '@angular/material';

export interface TabType  {
    label: string;
    table: string;
    keys: {};
}

@Component({
  selector: 'bottom-tabs',
  templateUrl: './bottom-tabs.component.html',
  styleUrls: ['./bottom-tabs.component.scss']
})
export class BottomTabsComponent implements OnInit {

@Input() Tabs: TabType[];

 activeIndex = 0;

  constructor() { }

  ngOnInit() {
  }

  tabChanged(tabChangeEvent: MatTabChangeEvent): void {
      this.activeIndex = tabChangeEvent.index;
  }

}
