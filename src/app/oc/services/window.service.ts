import { Injectable } from '@angular/core';
import { TimeTrackerService } from './time_tracker.service';

@Injectable({
    providedIn: 'root'
})
export class WindowService {

    isInitialized: boolean = false;

    /**
     * Constructor
     *
     */
    constructor(private _timeTrackerService: TimeTrackerService) {
    }

    public Initialize() {
        if(!this.isInitialized) {
            // Add focus events
            window.addEventListener('focus', (event) => this.runFocusEvent(event));
            window.addEventListener('blur', (event) => this.runBlurEvent(event));

            this.isInitialized = true;
        }        
    }

    /**
     * Run Focus events
     */
    public runFocusEvent(ev: any) {
        this._timeTrackerService.checkStatus();
    }
    
    /**
     * Run Blur events
     */
    public runBlurEvent(ev: any) {
        // alert('Blur!');
    }
    
}

