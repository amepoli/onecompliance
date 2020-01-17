import { FuseNavigation } from '@fuse/types';

export const navigation: FuseNavigation[] = [
    {
        id       : 'gorico',
        title    : 'Menu',
        type     : 'group',
        children : [
            {
                id       : 'dashboards',
                title    : 'Dashboards',
                translate: 'NAV.DASHBOARDS',
                type     : 'item',
                icon     : 'dashboard',
                url      : '/gorico/dashboard'
            }
        ]
    }
];
