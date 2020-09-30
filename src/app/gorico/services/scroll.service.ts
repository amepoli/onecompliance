import { EventEmitter, Injectable } from '@angular/core';

export interface ScrollInfo {
    x: number;
    y: number;
};

@Injectable({
    providedIn: 'root'
})
export class ScrollService {

    /**
     * MainTableScrollEventEmitter
     */
    public static MainTableScrollEventEmitter = new EventEmitter<ScrollInfo>();

    /**
     * Constructor
     *
     */
    constructor() {
    }


    /**
     * cumulativeOffset Get offset of an elemnt from the top most parent
     * @param element
     */
    public static cumulativeOffset(element) {
        var top = 0, left = 0;
        do {
            top += element.offsetTop || 0;
            left += element.offsetLeft || 0;
            element = element.offsetParent;
        } while (element);

        return {
            top: top,
            left: left
        };
    };

}

