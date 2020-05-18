import { Component, Input, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, AfterViewInit, DoCheck } from '@angular/core';

import 'rxjs/add/operator/filter';
import { FormViewComponent } from '../form/form-view.component';

@Component({
    selector: 'form-view-toolbar',
    templateUrl: './form-view-toolbar.component.html',
    styleUrls: ['./form-view-toolbar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FormViewToolbarComponent implements DoCheck {

    @Input("formView") formView: FormViewComponent;

    constructor(private cdr: ChangeDetectorRef) { }

    ngDoCheck() {
        this.cdr.detectChanges();
    }

}
