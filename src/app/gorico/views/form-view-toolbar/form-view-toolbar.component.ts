import { Component, Input, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, AfterViewInit, DoCheck, OnChanges } from '@angular/core';

import 'rxjs/add/operator/filter';
import { FormViewComponent } from '../form/form-view.component';
import { NavigationService } from 'app/gorico/services/navigation.service';

@Component({
    selector: 'form-view-toolbar',
    templateUrl: './form-view-toolbar.component.html',
    styleUrls: ['./form-view-toolbar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FormViewToolbarComponent implements DoCheck {

    @Input("formView") formView: FormViewComponent;

    hideActions: string[];
    constructor(private cdr: ChangeDetectorRef,
        private _navigationService: NavigationService) {
    }

    ngDoCheck() {
        this.cdr.detectChanges();
    }

}
