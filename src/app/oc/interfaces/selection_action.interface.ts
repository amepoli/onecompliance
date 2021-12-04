import { MenuOption } from ".";

export interface SelectionAction {
    viewType: 'button' | 'menu';
    key: string;
    label: string;
    icon: string;
    menuOptions: MenuOption[];
};