import { Component, Input, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, AfterViewInit, DoCheck, OnChanges, Output, EventEmitter } from '@angular/core';
import { AuthService } from 'app/oc/services';

// 
// import { FormViewComponent } from '../../views/form/form-view.component';

@Component({
    selector: 'share',
    templateUrl: './share.component.html',
    styleUrls: ['./share.component.scss']
})
export class ShareComponent {

    @Input() tooltip: string;
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
