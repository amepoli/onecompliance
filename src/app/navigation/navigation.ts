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
            },
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
                        url  : '/gorico/main-table/anagrafiche'
                    },
                    {
                        id   : 'management_units',
                        title: 'Management Units',
                        translate: 'NAV.MGTUNITS',
                        type : 'item',
                        url  : '/gorico/main-table/centri_gestionali'
                    }
                ]
            },
            {
                id       : 'processes',
                title    : 'Processes',
                translate: 'NAV.PROCESSES',
                icon: 'build',
                type : 'item',
                url  : '/gorico/main-table/procedure_aziendali'
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
                url  : '/gorico/main-table/rischi'
            },
            {
                id       : 'tasks',
                title    : 'Tasks',
                translate: 'NAV.TASKS',
                icon: 'new_releases',
                type : 'item',
                url  : '/gorico/main-table/compiti'
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
                        url  : '/gorico/main-table/modelli_test'
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
                        url  : '/gorico/main-table/testi_normativi'
                    },
                    {
                        id   : 'articles',
                        title: 'Articles',
                        translate: 'NAV.ARTICLES',
                        type : 'item',
                        url  : '/gorico/main-table/articoli_normativi'
                    }
                ]
            },
            {
                id       : 'privacy',
                title    : 'Privacy',
                translate: 'NAV.PRIVACY',
                type     : 'collapsable',
                icon     : 'lock',
                children : [
                    {
                        id   : 'processing_activities',
                        title: 'Processing',
                        translate: 'NAV.PROCACT',
                        type : 'item',
                        url  : '/gorico/main-table/cpl_trattamenti_dati'
                    }
                ]
            },{
                id       : 'configuration',
                title    : 'Configuration',
                translate: 'NAV.CONFIG',
                type     : 'collapsable',
                icon     : 'settings',
                children : [
                    {
                        id   : 'testformtype',
                        title: 'Test Form Types',
                        translate: 'NAV.TFTYPES',
                        type : 'item',
                        url  : '/login'
                    },
                    {
                        id   : 'tasktypes',
                        title: 'Task Types',
                        translate: 'NAV.TASKTYPES',
                        type : 'item',
                        url  : '/login'
                    },
                    {
                        id   : 'risktypes',
                        title: 'Risk Types',
                        translate: 'NAV.RISKTYPES',
                        type : 'item',
                        url  : '/login'
                    },
                    {
                        id   : 'topics',
                        title: 'Topics',
                        translate: 'NAV.TOPICS',
                        type : 'item',
                        url  : '/gorico/main-table/argomenti'
                    }
                ]
            },
            {
                id       : 'procac',
                title    : 'Processing Activities',
                translate: 'NAV.PROCACT',
                icon: 'play_for_work',
                type : 'item',
                url  : '/login'
            }
        ]
    }
];
