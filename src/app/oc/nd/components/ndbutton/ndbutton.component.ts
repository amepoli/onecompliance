import { Component, OnInit, OnDestroy, Input } from '@angular/core';

@Component({
    selector: 'oc-button',
    templateUrl: './ndbutton.component.html',
    styleUrls: ['./ndbutton.component.scss'],
    host: {
    }
})

export class NDButtonComponent {

    @Input()
    type?: 'primary' | 'secondary' | 'light';
  
    @Input()
    label: string;
  
    @Input()
    disabled: boolean;
  
    @Input()
    size?:  'normal' | 'large';

    constructor() { }

}
