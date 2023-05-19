export interface MenuOption {
  key?: string;
  icon: string;
  label: string;
  isHidden?: boolean;
  tooltip?: string;  
  confirmAction?: boolean;
  confirmActionMessage?: string;
  reloadOnSuccess?: boolean;
  outputEventName?: string;
  customDialogEntryName?: string;             
  customDialogTitle?: string;             
}