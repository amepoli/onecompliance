import { FormActionType, TableActionType, ViewType  } from "../types";

export interface HideAction {
    viewType: ViewType;
    tableActionType: TableActionType;
    formActionType: FormActionType;
}