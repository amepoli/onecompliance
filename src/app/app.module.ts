import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule, Routes } from '@angular/router';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

import { FuseModule } from '@fuse/fuse.module';
import { FuseSharedModule } from '@fuse/shared.module';
import { FuseProgressBarModule, FuseSidebarModule, FuseThemeOptionsModule } from '@fuse/components';

import { fuseConfig } from 'app/fuse-config';

import { AppComponent } from 'app/app.component';
import { AppStoreModule } from 'app/store/store.module';
import { LayoutModule } from 'app/layout/layout.module';
import { LoginPageModule } from 'app/gorico/login-page/login-page.module';
import { RegisterModule } from 'app/gorico/login-page/register.module';
import { MainTableModule } from 'app/gorico/main-table/main-table.module';
import { MailConfirmModule } from 'app/gorico/login-page/mail-confirm.module';
import { ForgotPasswordModule } from 'app/gorico/login-page/forgot-password.module';
import { AmplifyAngularModule, AmplifyService } from 'aws-amplify-angular';
import { NgxPubSubModule } from '@pscoped/ngx-pub-sub';
import { MainDashboardsModule } from 'app/gorico/main-dashboards/main-dashboards.module';
import { RedirectModule } from 'app/gorico/redirect/redirect.module';

import { ToastrModule } from 'ngx-toastr';


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
        RegisterModule,
        MailConfirmModule,
        ForgotPasswordModule,
        MainTableModule,
        AmplifyAngularModule,
        NgxPubSubModule,
        MainDashboardsModule,

        // Redirect
        RedirectModule,

    ],
    providers: [
        AmplifyService
    ],
    bootstrap: [
        AppComponent
    ]
})
export class AppModule {
}
