import { Injectable } from '@angular/core';
import { MessageView } from '../interfaces';


@Injectable({
    providedIn: 'root'
})
export class MessagesService {

    /**
     * Constructor
     *
     */
    constructor() {
    }

    /**
         * Get Form Message Views
         * @param messageViews Message Views list
         * @returns Form Message Views
         */
    getFormMessages(messageViews: MessageView[]) {
        if (!messageViews || !messageViews.length) {
            return [];
        }
        return messageViews
            .filter(a => a.viewType === "form")
            .map(a => {
                return {
                    messageType: a.formMessageType,
                    message: a.message
                }
            });
    }

    /**
     * Get Table Message Views
     * @param messageViews Message Views list
     * @returns Table Message Views
     */
    getTableMessages(messageViews: MessageView[]) {
        if (!messageViews || !messageViews.length) {
            return [];
        }
        return messageViews
            .filter(a => a.viewType === "table")
            .map(a => {
                return {
                    messageType: a.tableMessageType,
                    message: a.message
                }
            });
    }
}

