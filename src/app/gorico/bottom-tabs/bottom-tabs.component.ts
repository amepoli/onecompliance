import { Component, OnInit } from '@angular/core';


@Component({
  selector: 'bottom-tabs',
  templateUrl: './bottom-tabs.component.html',
  styleUrls: ['./bottom-tabs.component.scss']
})
export class BottomTabsComponent implements OnInit {

  Tabs = [
    { label: 'Tab1' },
    { label: 'Tab2' },
    { label: '...' }
  ];

  constructor() { }

  ngOnInit() {
  }

}
