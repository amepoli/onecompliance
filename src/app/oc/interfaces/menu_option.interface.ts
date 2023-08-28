export interface MenuOption {
  key?: string;
  icon: string;
  label: string;
  translate?: string;
  isHidden?: boolean;
  tooltip?: string;  
  confirmAction?: boolean;
  confirmActionMessage?: string;
  reloadOnSuccess?: boolean;
  outputEventName?: string;
  customDialogGenericSave?: boolean;
  customDialogEntryName?: string;             
  customDialogTitle?: string;             
}