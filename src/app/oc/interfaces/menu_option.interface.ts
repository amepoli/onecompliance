export interface MenuOption {
  key?: string;
  icon: string;
  label: string;
  isHidden?: boolean;
  confirmAction?: boolean;
  confirmActionMessage?: string;
  reloadOnSuccess?: boolean;
  outputEventName?: string;
}