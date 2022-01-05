import { Component, Input, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, AfterViewInit, DoCheck, OnChanges, Output, EventEmitter } from '@angular/core';
import { AuthService } from 'app/oc/services';

import 'rxjs/add/operator/filter';
import { FormViewComponent } from '../../views/form/form-view.component';

@Component({
    selector: 'attachments',
    templateUrl: './attachments.component.html',
    styleUrls: ['./attachments.component.scss']
})
export class AttachmentsComponent {

    @Input("numAttachments") numAttachments: number;
    @Output() onClick = new EventEmitter<boolean>();

    constructor() {
    }

    performClick(){
        this.onClick.emit(true);
    }
}
