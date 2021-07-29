import { FuseNavigation } from '@fuse/types';

export const navigation: FuseNavigation[] = [
    {
        id       : 'oc',
        title    : 'Menu',
        type     : 'group',
        children : [
            {
                id       : 'me',
                title    : 'Me',
                translate: 'NAV.ME',
                type     : 'item',
                icon     : 'account_circle',
                url      : '/oc/main-table/me'
            }
        ]
    }
];
