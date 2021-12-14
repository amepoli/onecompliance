import { MenuOption } from ".";

export interface SelectionAction {
    viewType: 'button' | 'menu';
    key: string;
    label: string;
    icon: string;
    confirmAction?: boolean;
    confirmActionMessage?: string;
    menuOptions: MenuOption[];
};