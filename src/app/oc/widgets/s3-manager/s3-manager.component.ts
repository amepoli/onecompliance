import { Component, Input, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, AfterViewInit, DoCheck, OnChanges, Output, EventEmitter } from '@angular/core';
import { AuthService, BackendService } from 'app/oc/services';

import 'rxjs/add/operator/filter';
import { FormViewComponent } from '../../views/form/form-view.component';

@Component({
    selector: 's3-manager',
    templateUrl: './s3-manager.component.html',
    styleUrls: ['./s3-manager.component.scss']
})
export class S3ManagerComponent implements AfterViewInit{

    @Output() onClick = new EventEmitter<any>();

    userdata: any;
    userCompanies: string[] = [];
    
    folders: string[] = [];

    constructor(private _authService: AuthService, private _backendService: BackendService) {
        // get user data after login
        this.userdata = this._authService.userinfo.getValue();
        
        // set the company set
        this.userCompanies = this.userdata.companies;

    }

    ngAfterViewInit() {
        this.getContents();
    }

    performClick(item){
        this.onClick.emit(item);
    }

    getContents() {
        let _this = this;
        _this._backendService.getContents('attachments',  _this._authService.getCurrentCompany(), {})
        .subscribe( result => {
            _this.folders = result.contents.CommonPrefixes.map( x => x.Prefix);
            console.log(result);
        },
        error => {
            console.log(error);
        });
    }
}
