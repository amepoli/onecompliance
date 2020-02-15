import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule, Routes } from '@angular/router';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatButtonModule, MatIconModule } from '@angular/material';
import { TranslateModule } from '@ngx-translate/core';
import 'hammerjs';

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
import { AmplifyAngularModule, AmplifyService } from 'aws-amplify-angular';
import { NgxPubSubModule } from '@pscoped/ngx-pub-sub';
import { MainDashboardsModule } from 'app/gorico/main-dashboards/main-dashboards.module';

const appRoutes: Routes = [];

@NgModule({
    declarations: [
        AppComponent
    ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        HttpClientModule,
        RouterModule.forRoot(appRoutes),

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

        // App modules
        LayoutModule,
        AppStoreModule,

        // nikapov modules
        LoginPageModule,
        RegisterModule,
        MailConfirmModule,
        MainTableModule,
        AmplifyAngularModule,
        NgxPubSubModule,
        MainDashboardsModule

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
