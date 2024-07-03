import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule, Routes } from '@angular/router';
import { MatMomentDateModule, MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

import { QRCodeModule } from 'angular2-qrcode';

import { FuseModule } from '@fuse/fuse.module';
import { FuseSharedModule } from '@fuse/shared.module';
import { FuseProgressBarModule, FuseSidebarModule, FuseThemeOptionsModule } from '@fuse/components';

import { fuseConfig } from 'app/fuse-config';

import { AppComponent } from 'app/app.component';
import { AppStoreModule } from 'app/store/store.module';
import { LayoutModule } from 'app/layout/layout.module';
import { LoginPageModule } from 'app/oc/login-page/login-page.module';
import { RegisterModule } from 'app/oc/login-page/register.module';
import { MainTableModule } from 'app/oc/main-table/main-table.module';
import { MailConfirmModule } from 'app/oc/login-page/mail-confirm.module';
import { ForgotPasswordModule } from 'app/oc/login-page/forgot-password.module';
import { AmplifyAngularModule, AmplifyService } from 'aws-amplify-angular';
import { MainDashboardsModule } from 'app/oc/main-dashboards/main-dashboards.module';
import { RedirectModule } from 'app/oc/redirect/redirect.module';
import { ToastrModule } from 'ngx-toastr';

import { HomepageModule } from './oc/homepage/homepage.module';
import { HomepageTabModule } from './oc/homepage-tab/homepage-tab.module';
import { ToolbarElementsModule } from './oc/toolbar-elements/toolbar-elements.module';
import { ExplorerModule } from './oc/explorer/explorer.module';
import { CalendarModule } from './oc/calendar/calendar.module';
import { ChangePasswordModule } from './oc/login-page/change-password.module';

const appRoutes: Routes = [];

@NgModule({
    declarations: [
        AppComponent
    ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        HttpClientModule,

        // Without hash location strategy
        // RouterModule.forRoot(appRoutes),

        // With hash location strategy
        RouterModule.forRoot(appRoutes, { onSameUrlNavigation: 'reload', useHash: true }),

        TranslateModule.forRoot(),

        // QR Code library
        QRCodeModule,

        // Material moment date module
        MatMomentDateModule,

        // Material
        MatButtonModule,
        MatIconModule,

        // Fuse modules
        FuseModule.forRoot(fuseConfig),
        FuseProgressBarModule,
        FuseSharedModule,
        FuseSidebarModule,
        FuseThemeOptionsModule,

        // ToastrModule
        ToastrModule.forRoot(),

        // App modules
        LayoutModule,
        AppStoreModule,

        // nikapov modules
        LoginPageModule,
        ChangePasswordModule,
        RegisterModule,
        MailConfirmModule,
        ForgotPasswordModule,
        MainTableModule,
        AmplifyAngularModule,
        MainDashboardsModule,

        // zee modules
        HomepageModule,
        HomepageTabModule,
        CalendarModule,
        ToolbarElementsModule,
        ExplorerModule,
        
        // Redirect
        RedirectModule,

    ],
    providers: [
        AmplifyService,
        { provide: MAT_MOMENT_DATE_ADAPTER_OPTIONS, useValue: { useUtc: true } }
    ],
    bootstrap: [
        AppComponent
    ]
})
export class AppModule {
}
