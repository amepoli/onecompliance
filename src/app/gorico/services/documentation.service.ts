import { Injectable } from '@angular/core';
import {URLs} from '../../documentation';

@Injectable({
    providedIn: 'root'
})
export class DocumentationService {

    /**
     * Constructor
     *
     */
    constructor() {
    }

    /**
     * Open FormView Documentation Link
     * @param formViewName
     */
    public static openFormViewDocumentationLink(formViewName) {
        window.open(URLs[formViewName]);
    }    
}

