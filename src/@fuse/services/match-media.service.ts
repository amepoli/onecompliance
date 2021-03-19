import { MediaChange, MediaObserver } from '@angular/flex-layout';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class FuseMatchMediaService
{
    activeMediaQuery: string;
    onMediaChange: BehaviorSubject<string> = new BehaviorSubject<string>('');

    /**
     * Constructor
     *
     * @param {MediaObserver} _MediaObserver
     */
    constructor(
        private _MediaObserver: MediaObserver
    )
    {
        // Set the defaults
        this.activeMediaQuery = '';

        // Initialize
        this._init();

    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Initialize
     *
     * @private
     */
    private _init(): void
    {
        this._MediaObserver
            .asObservable()
            .subscribe((change: MediaChange[]) => {
                if ( this.activeMediaQuery !== change[0].mqAlias )
                {
                    this.activeMediaQuery = change[0].mqAlias;
                    this.onMediaChange.next(change[0].mqAlias);
                }
            });
    }

}
