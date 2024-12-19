import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Platform } from '@angular/cdk/platform';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { FuseConfigService } from '@fuse/services/config.service';
import { FuseNavigationService } from '@fuse/components/navigation/navigation.service';
import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';
import { FuseSplashScreenService } from '@fuse/services/splash-screen.service';
import { FuseTranslationLoaderService } from '@fuse/services/translation-loader.service';
import { AuthService } from 'app/oc/services/auth.service';

import { navigation } from 'app/navigation/navigation';

import { Router, NavigationEnd } from '@angular/router';
import { BackendService } from './oc/services/backend.service';
import { ConsoleLoggerService } from './oc/services/console_logger.service';
import { WindowService } from './oc/services';

@Component({
    selector: 'app',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
    fuseConfig: any;
    navigation: any;

    // Private
    private _unsubscribeAll: Subject<any>;

    /**
     * Constructor
     *
     * @param {DOCUMENT} document
     * @param {FuseConfigService} _fuseConfigService
     * @param {FuseNavigationService} _fuseNavigationService
     * @param {FuseSidebarService} _fuseSidebarService
     * @param {FuseSplashScreenService} _fuseSplashScreenService
     * @param {FuseTranslationLoaderService} _fuseTranslationLoaderService
     * @param {Platform} _platform
     * @param {TranslateService} _translateService
     */
    constructor(
        @Inject(DOCUMENT) private document: any,
        private _fuseConfigService: FuseConfigService,
        private _fuseNavigationService: FuseNavigationService,
        private _fuseSidebarService: FuseSidebarService,
        private _fuseSplashScreenService: FuseSplashScreenService,
        private _translateService: TranslateService,
        private _platform: Platform,
        private router: Router,
        private _authService: AuthService,
        private _backendService: BackendService,
        private _console: ConsoleLoggerService,
        private _windowService: WindowService
    ) {

        // Initialize Window service
        this._windowService.Initialize();
        
        // Add languages
        this._translateService.addLangs(['it', 'en']);

        // Set the default language
        // this._translateService.setDefaultLang('en');

        // Set the navigation translations
        // this._fuseTranslationLoaderService.loadTranslations(navigationItalian, navigationEnglish);

        // Get default navigation
        this.navigation = navigation;

        // Register the navigation to the service
        this._fuseNavigationService.register('main', this.navigation);

        // Set the main navigation as our current navigation
        this._fuseNavigationService.setCurrentNavigation('main');

        // Add is-mobile class to the body if the platform is mobile
        if (this._platform.ANDROID || this._platform.IOS) {
            this.document.body.classList.add('is-mobile');
        }

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

        // Subscribe to config changes
        this._fuseConfigService.config
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((config) => {
                this.fuseConfig = config;

                if (this.fuseConfig.layout.width === 'boxed') {
                    this.document.body.classList.add('boxed');
                }
                else {
                    this.document.body.classList.remove('boxed');
                }
            });

        // Redirect to login if not signed in
        this.router.events.subscribe((e) => {
            if (e instanceof NavigationEnd) {
                // Check if not signed in and we are not currently on login or register page
                if (e.url !== '/' && !this._authService.isSignedIn && !e.url.includes('login') && !e.url.includes('privacy-policy') && !e.url.includes('cookie-policy') && !e.url.includes('register') && !e.url.includes('forgot-password') && !e.url.includes('change-password') && !e.url.includes('mail-confirm')) {
                    this._console.log('Redirecting to login page');
                    // Add redirect path if not home
                    if (e.url.length > 3) {
                        this.router.navigate([`/login/${encodeURIComponent(e.url)}`]);
                    }
                    else {
                        this.router.navigate([`/login`]);
                    }
                }

            }
        });
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Toggle sidebar open
     *
     * @param key
     */
    toggleSidebarOpen(key): void {
        this._fuseSidebarService.getSidebar(key).toggleOpen();
    }
}
