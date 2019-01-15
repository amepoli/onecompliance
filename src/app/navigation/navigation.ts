import { FuseNavigation } from '@fuse/types';

export const navigation: FuseNavigation[] = [
    {
        id       : 'gorico',
        title    : 'Menu',
        type     : 'group',
        children : [
            {
                id       : 'organization',
                title    : 'Organization',
                translate: 'NAV.ORGANIZATION',
                type     : 'collapsable',
                icon     : 'account_box',
                children : [
                    {
                        id   : 'employees',
                        title: 'Employees',
                        translate: 'NAV.EMPLOYEES',
                        type : 'item',
                        url  : '/gorico/employees'
                    },
                    {
                        id   : 'management_units',
                        title: 'Management Units',
                        translate: 'NAV.MGTUNITS',
                        type : 'item',
                        url  : '/gorico/mngt-units'
                    }
                ]
            },
            {
                id       : 'processes',
                title    : 'Processes',
                translate: 'NAV.PROCESSES',
                icon: 'build',
                type : 'item',
                url  : '/gorico/processes'
            },
            {
                id       : 'workflow',
                title    : 'Workflow',
                icon: 'settings_input_component',
                type : 'item',
                url  : '/login'
            },
            {
                id       : 'controls',
                title    : 'Controls',
                translate: 'NAV.CONTROLS',
                icon: 'person_pin_circle',
                type : 'item',
                url  : '/login'
            },
            {
                id       : 'risks',
                title    : 'Risks',
                translate: 'NAV.RISKS',
                icon: 'report_problem',
                type : 'item',
                url  : '/login'
            },
            {
                id       : 'reports',
                title    : 'Reports',
                translate: 'NAV.REPORTS',
                icon: 'new_releases',
                type : 'item',
                url  : '/login'
            },
            {
                id       : 'testforms',
                title    : 'Test Forms',
                translate: 'NAV.TEST',
                type     : 'collapsable',
                icon     : 'playlist_add_check',
                children : [
                    {
                        id   : 'generic',
                        title: 'Generic',
                        translate: 'NAV.GENERIC',
                        type : 'item',
                        url  : '/login'
                    },
                    {
                        id   : 'questionnaires',
                        title: 'Questionnaires',
                        translate: 'NAV.QUEST',
                        type : 'item',
                        url  : '/login'
                    },
                    {
                        id   : 'checklist',
                        title: 'Checklist',
                        type : 'item',
                        url  : '/login'
                    },
                    {
                        id   : 'forms',
                        title: 'Forms',
                        translate: 'NAV.FORMS',
                        type : 'item',
                        url  : '/login'
                    }
                ]
            },
            {
                id       : 'surveys',
                title    : 'Surveys',
                translate: 'NAV.SURVEYS',
                type     : 'collapsable',
                icon     : 'playlist_play',
                children : [
                    {
                        id   : 'generic',
                        title: 'Generic',
                        translate: 'NAV.GENERIC',
                        type : 'item',
                        url  : '/login'
                    },
                    {
                        id   : 'questionnaires',
                        title: 'Questionnaires',
                        translate: 'NAV.QUEST',
                        type : 'item',
                        url  : '/login'
                    },
                    {
                        id   : 'checklist',
                        title: 'Checklist',
                        type : 'item',
                        url  : '/login'
                    },
                    {
                        id   : 'forms',
                        title: 'Forms',
                        translate: 'NAV.FORMS',
                        type : 'item',
                        url  : '/login'
                    }
                ]
            },
            {
                id       : 'laws',
                title    : 'Laws',
                translate: 'NAV.LAWS',
                type     : 'collapsable',
                icon     : 'account_balance',
                children : [
                    {
                        id   : 'law',
                        title: 'Law',
                        translate: 'NAV.LAW',
                        type : 'item',
                        url  : '/login'
                    },
                    {
                        id   : 'articles',
                        title: 'Articles',
                        translate: 'NAV.ARTICLES',
                        type : 'item',
                        url  : '/gorico/articles'
                    }
                ]
            }
        ]
    }
];
