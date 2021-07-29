import { FormActionType } from "../types";
import { MessageItem } from "./message_item.interface";

export interface MessageElement {
    /**
     * Message Type
     */
    messageType: FormActionType;

    /**
     * Message Item
     */
    message: MessageItem;
}