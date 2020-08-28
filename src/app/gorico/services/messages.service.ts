import { Injectable } from '@angular/core';

export interface MessageView {
    viewType: "table" | "form";
    tableActionType: "add" | "import_export";
    formActionType: "add" | "delete" | "save" | "share" | "attachments" | "navigate" | "import_export";
    message: MessageItem;
}

export interface MessageItem {
    /**
     * Message Title
     */
    title: string;

    /**
     * Message Text
     */
    text: string;
}

export interface MessageElement {
    /**
     * Message Type
     */
    messageType: "add" | "delete" | "save" | "share" | "attachments" | "navigate" | "import_export";

    /**
     * Message Item
     */
    message: MessageItem;
}


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
                    messageType: a.formActionType,
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
                    messageType: a.tableActionType,
                    message: a.message
                }
            });
    }
}

