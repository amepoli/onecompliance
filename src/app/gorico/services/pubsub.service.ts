import { Injectable, EventEmitter } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class PubSubService {

    /**
     * Constructor
     */
    constructor() {
    }

    // Event Emitter for hide actions
    public eventObservableMapping$: { [eventName: string]: EventEmitter<any> } = {}; 
    
    public publishEvent(eventName: string, data?: any) {
        if(this.eventObservableMapping$[eventName]) {
            this.eventObservableMapping$[eventName].emit(data);
        }
    }

    subscribe(eventName: string, next?: (value: any) => void, error?: (error: any) => any, complete?: () => void) {
        if(this.eventObservableMapping$[eventName]) {
            this.eventObservableMapping$[eventName] = new EventEmitter();
        }
        return this.eventObservableMapping$[eventName].subscribe(next, error);
    }

}

