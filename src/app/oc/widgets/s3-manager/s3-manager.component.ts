import { Component, Input, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, AfterViewInit, DoCheck, OnChanges, Output, EventEmitter } from '@angular/core';
import { FileManagerViewType } from 'app/oc/interfaces';
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
    
    viewTypeTiles = FileManagerViewType.Tiles;
    viewTypeDetails = FileManagerViewType.Details;
    curViewType = FileManagerViewType.Tiles;
    contentsPrefix = null;

    folders: string[] = [];
    files: string[] = [];

    isLoading = false;

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

    gotoFolder(folder) {
        this.contentsPrefix = folder;
        this.getContents();
    }

    getContents() {
        let _this = this;
        _this.isLoading = true;
        _this._backendService.getContents('attachments',  _this._authService.getCurrentCompany(), {}, _this.contentsPrefix)
        .subscribe( result => {
            _this.folders = result.contents.CommonPrefixes.map( x => x.Prefix);
            _this.files = result.contents.Contents.map( x => { return x.Key.split('/').at(-1)});
            _this.isLoading = false;
        },
        error => {
            console.log(error);
            _this.isLoading = false;
        });
    }
}
