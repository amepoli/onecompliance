import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';

import { FuseConfigService } from '@fuse/services/config.service';
import { fuseAnimations } from '@fuse/animations';

import { Router, ActivatedRoute } from '@angular/router';
import { AuthService, DialogService } from '../services';
import { TimezoneService } from '../services/timezone.service';


@Component({
    selector: 'start-page',
    templateUrl: './start-page.component.html',
    styleUrls: ['./start-page.component.scss'],
    animations: fuseAnimations
})
export class StartPageComponent implements OnInit {
    
    // Text to show on Start button
    startButtonText = 'LOGIN';

    // Url used to return to after successfully logging in
    returnUrl = '/oc/startpage';

    constructor( 
        private _fuseConfigService: FuseConfigService,
        private router: Router,
    ) {
        // Configure the layout
        this._fuseConfigService.config = {
            layout: {
                navbar   : {
                    hidden: true
                },
                toolbar  : {
                    hidden: true
                },
                footer   : {
                    hidden: true
                },
                sidepanel: {
                    hidden: true
                }
            }
        };
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
    }

    gotoLoginPage(): void {
        this.router.navigate([`/login`]);   
    }
}
