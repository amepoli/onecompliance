import { Component, Input, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, AfterViewInit, DoCheck, OnChanges } from '@angular/core';
import { AuthService } from 'app/gorico/services';

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

    userCompanies: string[] = [];
    userdata: any;
    
    constructor(private cdr: ChangeDetectorRef, private _authService: AuthService) {
        // get user data after login
        this.userdata = this._authService.userinfo.getValue();
        
        // set the company set
        this.userCompanies = this.userdata.companies;

    }

    ngDoCheck() {
        this.cdr.detectChanges();
    }
}
