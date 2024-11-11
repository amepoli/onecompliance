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
    type?: 'filled' | 'outlined' | 'text';
  
    @Input()
    label: string;
  
    @Input()
    disabled: boolean;
  
    @Input()
    size?:  'small' | 'large';

    @Input()
    prefixIcon: string;
  
    @Input()
    postfixIcon: string;
    
    constructor() { 
        console.log(this.prefixIcon);
    }

}
