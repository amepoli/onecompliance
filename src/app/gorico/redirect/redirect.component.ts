import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { Router, ActivatedRoute } from '@angular/router';


@Component({
    selector: 'redirect',
    templateUrl: './redirect.component.html',
    styleUrls: ['./redirect.component.scss']
})
export class RedirectComponent implements OnInit {
    // Url used to return to after successfully logging in
    returnUrl = '/gorico/main-table/me';

    /**
     * Constructor
     *
     * @param {Router} _router
     * @param {ActivatedRoute} _route
     */
    constructor(
        private _router: Router,
        private _route: ActivatedRoute
    ) {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {

        // Check if we are supposed to redirect after logging in.
        let returnPath = this._route.snapshot.paramMap.get("return_path");
        if (returnPath) {
            this.returnUrl = decodeURIComponent(returnPath)
        }

        // Navigate to return path
        this._router.navigate([this.returnUrl]);


    }
}
