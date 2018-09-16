import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'selected-element',
  templateUrl: './selected-element.component.html',
  styleUrls: ['./selected-element.component.scss']
})
export class SelectedElementComponent implements OnInit {

  n = 1;
  tot = 50;

  constructor() { }

  ngOnInit() {
  }

}
