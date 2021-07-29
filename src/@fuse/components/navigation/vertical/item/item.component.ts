import { AfterViewInit, Component, HostBinding, Input } from '@angular/core';
import { Event, NavigationEnd, Router } from '@angular/router';

import { FuseNavigationItem } from '@fuse/types';
import { HelperService } from 'app/oc/services/helper.service';

@Component({
    selector: 'fuse-nav-vertical-item',
    templateUrl: './item.component.html',
    styleUrls: ['./item.component.scss']
})
export class FuseNavVerticalItemComponent implements AfterViewInit {
    @HostBinding('class')
    classes = 'nav-item';

    @Input()
    item: FuseNavigationItem;

    url: string = "";

    route() {
        if (window.location.href.includes(this.url)) {
            // console.log(window.location.href);
            HelperService.redirectTo(this._router, this.url);
        }

        // this._router.events.subscribe((event: Event) => {
        //     if (event instanceof NavigationEnd && this.url == event.url) {
        //         console.log(event.url);
        //         HelperService.redirectTo(this._router, this.url);
        //     }
        // });
        // alert("Hi!");
    }

    /**
     * Constructor
     */
    constructor(private _router: Router) {
    }

    ngAfterViewInit() {
        if (this.item) {
            this.url = this.item.url;
            this.item.function = this.route.bind(this);
            // alert(this.item.function);
        }
    }
}
