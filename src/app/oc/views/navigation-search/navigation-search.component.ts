import { Component, ChangeDetectionStrategy } from '@angular/core';

import 'rxjs/add/operator/filter';
import { AuthService } from 'app/oc/services';

@Component({
    selector: 'navigation-search',
    templateUrl: './navigation-search.component.html',
    styleUrls: ['./navigation-search.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavigationSearchComponent {

    curValue: string = null;

    constructor(
        private _authService: AuthService) {
    }

    filter() {
        this._authService.filterMenu(this.curValue);
    }

    clear() {
        this.curValue = '';
        this._authService.filterMenu(this.curValue);
    }
}
