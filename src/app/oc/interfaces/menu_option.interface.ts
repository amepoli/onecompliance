export interface MenuOption {
  key?: string;
  icon: string;
  label: string;
  confirmAction?: boolean;
  confirmActionMessage?: string;
  reloadOnSuccess?: boolean;
  outputEventName?: string;
}