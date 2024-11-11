import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';

import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

import * as FiltersActions from 'app/main/apps/mail-ngrx/store/actions/filters.actions';
import { MailNgrxService } from 'app/main/apps/mail-ngrx/mail.service';

@Injectable()
export class FiltersEffect {
    constructor(
        private actions: Actions,
        private mailService: MailNgrxService
    ) {
    }

    /**
     * Get filters from Server
     * @type {Observable<any>}
     */
    getFilters: Observable<FiltersActions.FiltersActionsAll> =
        createEffect(() => this.actions
            .pipe(
                ofType<FiltersActions.GetFilters>(FiltersActions.GET_FILTERS),
                switchMap((action) => {
                    return this.mailService.getFilters()
                        .pipe(
                            map((filters: any) => {
                                return new FiltersActions.GetFiltersSuccess(filters);
                            }),
                            catchError(err => of(new FiltersActions.GetFiltersFailed(err)))
                        );
                }
                )));
}
