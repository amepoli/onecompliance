import { FormActionType, TableActionType, ViewType } from "../types";
import { MessageItem } from "./message_item.interface";

export interface MessageView {
    viewType: ViewType;
    tableMessageType: TableActionType;
    formMessageType: FormActionType;
    message: MessageItem;
}