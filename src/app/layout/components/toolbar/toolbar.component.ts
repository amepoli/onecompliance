import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';

import { FuseConfigService } from '@fuse/services/config.service';
import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';

import { navigation } from 'app/navigation/navigation';

import { DomSanitizer } from '@angular/platform-browser';
import { MatIconRegistry } from '@angular/material';

import { AuthService, UserInfo } from 'app/gorico/login-page/auth.service';
import { BackendService } from 'app/gorico/views/backend/backend.service';

import { Router } from '@angular/router';

import { NgxPubSubService } from '@pscoped/ngx-pub-sub';
import { ReportService } from 'app/gorico/services/report.service';
import { ImportItem, ExportItem, ImportExportService } from 'app/gorico/services/import_export.service';
import { NavigationService } from 'app/gorico/services/navigation.service';
import { MessageView, MessageElement } from 'app/gorico/services/messages.service';
import { ConsoleLoggerService } from 'app/gorico/services/console_logger.service';


@Component({
    selector: 'toolbar',
    templateUrl: './toolbar.component.html',
    styleUrls: ['./toolbar.component.scss']
})

export class ToolbarComponent implements OnInit, OnDestroy {
    horizontalNavbar: boolean;
    rightNavbar: boolean;
    hiddenNavbar: boolean;
    languages: any;
    navigation: any;
    selectedLanguage: any;
    userStatusOptions: any[];

    reportList: { 'alias': string, 'descrizione': string }[] = [];
    importList: ImportItem[] = [];
    exportList: ExportItem[] = [];

    userCompanies: string[] = [];

    pubMsgCmdTopic = '/toolbar/out/cmd';
    subMsgCmdTopic = '/toolbar/in/cmd';

    userdata: UserInfo;

    currentCompany: string;

    dashboardTables: string[];

    hideActions: string[] = []; // Hide Actions

    messages: MessageElement[] = []; // Messages

    // Private
    private _unsubscribeAll: Subject<any>;

    /**
     * Constructor
     *
     * @param {FuseConfigService} _fuseConfigService
     * @param {FuseSidebarService} _fuseSidebarService
     * @param {TranslateService} _translateService
     */
    constructor(
        private _fuseConfigService: FuseConfigService,
        private _fuseSidebarService: FuseSidebarService,
        private _translateService: TranslateService,
        private _iconRegistry: MatIconRegistry,
        private _sanitizer: DomSanitizer,
        private _authService: AuthService,
        private _backendService: BackendService,
        private _pubSubService: NgxPubSubService,
        private router: Router,
        private _reportService: ReportService,
        private _importExportService: ImportExportService,
        private _navigationService: NavigationService,
        private _console: ConsoleLoggerService
    ) {
        // Set the defaults
        this.userStatusOptions = [
            {
                'title': 'Online',
                'icon': 'icon-checkbox-marked-circle',
                'color': '#4CAF50'
            },
            {
                'title': 'Away',
                'icon': 'icon-clock',
                'color': '#FFC107'
            },
            {
                'title': 'Do not Disturb',
                'icon': 'icon-minus-circle',
                'color': '#F44336'
            },
            {
                'title': 'Invisible',
                'icon': 'icon-checkbox-blank-circle-outline',
                'color': '#BDBDBD'
            },
            {
                'title': 'Offline',
                'icon': 'icon-checkbox-blank-circle-outline',
                'color': '#616161'
            }
        ];

        this.languages = [
            {
                id: 'it',
                title: 'Italiano',
                flag: 'it'
            },
            {
                id: 'en',
                title: 'English',
                flag: 'us'
            }
        ];

        this.navigation = navigation;

        this._iconRegistry.addSvgIcon(
            'excel',
            this._sanitizer.bypassSecurityTrustResourceUrl('assets/images/examples/excel.svg'));

        this._iconRegistry.addSvgIcon(
            'importCSV',
            this._sanitizer.bypassSecurityTrustResourceUrl('assets/images/icons/import.svg'));


        // Set the private defaults
        this._unsubscribeAll = new Subject();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {

        const _this = this;

        // Subscribe to the config changes
        _this._fuseConfigService.config
            .pipe(takeUntil(_this._unsubscribeAll))
            .subscribe((settings) => {
                _this.horizontalNavbar = settings.layout.navbar.position === 'top';
                _this.rightNavbar = settings.layout.navbar.position === 'right';
                _this.hiddenNavbar = settings.layout.navbar.hidden === true;
            });


        _this._reportService.onReportsLoaded.subscribe((data) => {
            _this.reportList = data.reports;
        });

        _this._importExportService.onImportListLoaded.subscribe((data) => {
            _this.importList = data.items;
        });

        _this._importExportService.onExportListLoaded.subscribe((data) => {
            _this.exportList = data.items;
        });

        _this._navigationService.onToolbarHideActionsChanged.subscribe(hideActions => {
            _this.hideActions = hideActions;
        });

        _this._navigationService.onDashboardTableLoad.subscribe(dashboardData => {
            const url = _this.router.url;
            const currentTable = url.substring(url.lastIndexOf('/') + 1);
            if (dashboardData.origin === currentTable) {
                _this.dashboardTables = dashboardData.dashboardTables;
            }
        });

        // Old method using pubsubservice
        // _this._pubSubService.subscribe(_this.subMsgCmdTopic,
        //     msg => {
        //         if (msg.type === 'print_list') {
        //             _this.reportList = msg.value;
        //             console.log("Loading reports!");
        //         }
        //     });

        // get user data after login
        _this.userdata = _this._authService.userinfo.getValue();

        // set the company set
        _this.userCompanies = _this.userdata.companies;

        _this.setCompany(_this._authService.getCurrentCompany(), false);

        _this._translateService.use(_this.userdata.language);

        // Set the selected language from default languages
        _this.selectedLanguage = _.find(_this.languages, { 'id': _this._translateService.currentLang });


    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        const _this = this;
        // Unsubscribe from all subscriptions
        _this._unsubscribeAll.next();
        _this._unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------


    setCompany(company: string, fromInterface: boolean): void {

        this.currentCompany = company;
        // update the user infos and left menu 
        this._authService.updateUserInfo(company);
        if (fromInterface) {
            // reload the main page 
            this.router.navigate(['/login']);
        }



    }

    /**
     * Toggle sidebar open
     *
     * @param key
     */
    toggleSidebarOpen(key): void {
        this._fuseSidebarService.getSidebar(key).toggleOpen();
    }

    /**
     * Search
     *
     * @param value
     */
    search(value): void {
        // Do your search here...
        this._console.log(value);
    }

    /**
     * Set the language
     *
     * @param lang
     */
    setLanguage(lang): void {
        // Set the selected language for the toolbar
        this.selectedLanguage = lang;

        // Use the selected language for translations
        this._translateService.use(lang.id);
        this._translateService.setDefaultLang(lang.id);

        // set it into the service for the reload
        this._authService.userinfo.value.language = lang.id;
        // reload the main page 
        this.router.navigate(['/login']);
    }

    logout(): void {
        const _this = this;
        _this._console.log('Signing out');
        _this._authService.signOut();
        _this.router.navigate(['/login']);
    }

    addElement(): void {
        this._pubSubService.publishEvent(this.pubMsgCmdTopic, { type: 'add' });
    }

    gotoList(): void {
        this._pubSubService.publishEvent(this.pubMsgCmdTopic, { type: 'list' });
    }

    gotoDashboard(): void {
        this.router.navigate(['/gorico/dashboard', {table: this.dashboardTables}]);
    }

    getReportList(): void {
        // this._pubSubService.publishEvent(this.pubMsgCmdTopic, { type: 'print_list' });
        this._console.log("No need to getReportList in toolbar now. Report already loaded!");
    }

    getReport(item: { 'alias': string, 'descrizione': string }): void {
        this._console.log(item);
        this._reportService.requestGetReport(item.alias);
        // this._pubSubService.publishEvent(this.pubMsgCmdTopic, { type: 'print_item', value: item.alias });
    }

    getExcel(): void {
        this._pubSubService.publishEvent(this.pubMsgCmdTopic, { type: 'get_excel' });
    }

    import(): void {
        this._importExportService.requestImport();
        // this._pubSubService.publishEvent(this.pubMsgCmdTopic, { type: 'import' });
    }

    importAdvanced(item: ImportItem) {
        this._importExportService.requestAdvancedImport(item.label);
    }

    downloadTemplateFile(): void {
        this._importExportService.requestGetTemplate();
        // this._pubSubService.publishEvent(this.pubMsgCmdTopic, { type: 'downloadTemplateFile' });
    }

    downloadCSV() {
        this._console.log('Downloading CSV');
        this._importExportService.requestGetCSV(null);
    }

    downloadAdvancedCSV(item: ExportItem): void {
        this._console.log(item);
        this._importExportService.requestGetCSV(item.label);
        // this._pubSubService.publishEvent(this.pubMsgCmdTopic, { type: 'print_item', value: item.alias });
    }

    downloadExcel() {
        this._console.log('Downloading CSV');
        this._importExportService.requestGetExcel(null);
    }

    downloadAdvancedExcel(item: ExportItem): void {
        this._console.log(item);
        this._importExportService.requestGetExcel(item.label);
        // this._pubSubService.publishEvent(this.pubMsgCmdTopic, { type: 'print_item', value: item.alias });
    }


}
