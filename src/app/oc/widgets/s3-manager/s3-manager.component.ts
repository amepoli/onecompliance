import { Component, Input, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, AfterViewInit, DoCheck, OnChanges, Output, EventEmitter } from '@angular/core';
import { AuthService } from 'app/oc/services';

import 'rxjs/add/operator/filter';
import { FormViewComponent } from '../../views/form/form-view.component';

@Component({
    selector: 's3-manager',
    templateUrl: './s3-manager.component.html',
    styleUrls: ['./s3-manager.component.scss']
})
export class S3ManagerComponent {

    @Output() onClick = new EventEmitter<any>();

    userdata: any;
    userCompanies: string[] = [];
    
    constructor(private _authService: AuthService) {
        // get user data after login
        this.userdata = this._authService.userinfo.getValue();
        
        // set the company set
        this.userCompanies = this.userdata.companies;

    }

    performClick(item){
        this.onClick.emit(item);
    }
}
