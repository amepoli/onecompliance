import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule, Routes } from '@angular/router';
import { MatMomentDateModule, MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';
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
import { LoginPageModule } from 'app/oc/login-page/login-page.module';
import { RegisterModule } from 'app/oc/login-page/register.module';
import { MainTableModule } from 'app/oc/main-table/main-table.module';
import { MailConfirmModule } from 'app/oc/login-page/mail-confirm.module';
import { ForgotPasswordModule } from 'app/oc/login-page/forgot-password.module';
import { AmplifyAngularModule, AmplifyService } from 'aws-amplify-angular';
import { MainDashboardsModule } from 'app/oc/main-dashboards/main-dashboards.module';
import { RedirectModule } from 'app/oc/redirect/redirect.module';
import { ToastrModule } from 'ngx-toastr';

import { SocialLoginModule, SocialAuthServiceConfig } from 'angularx-social-login';
import { GoogleLoginProvider } from 'angularx-social-login';
import { HomepageModule } from './oc/homepage/homepage.module';
import { HomepageTabModule } from './oc/homepage-tab/homepage-tab.module';
import { ToolbarElementsModule } from './oc/toolbar-elements/toolbar-elements.module';

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
        RouterModule.forRoot(appRoutes, { onSameUrlNavigation: 'reload', useHash: true, relativeLinkResolution: 'legacy' }),

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
        MainDashboardsModule,

        // zee modules
        HomepageModule,
        HomepageTabModule,
        ToolbarElementsModule,
        
        // Redirect
        RedirectModule,

        // Social
        SocialLoginModule
    ],
    providers: [
        AmplifyService,
        { provide: MAT_MOMENT_DATE_ADAPTER_OPTIONS, useValue: { useUtc: true } },
        {
            provide: 'SocialAuthServiceConfig',
            useValue: {
                autoLogin: false,
                providers: [
                {
                    id: GoogleLoginProvider.PROVIDER_ID,
                    provider: new GoogleLoginProvider(
                    '380240687769-t5gsbc7upsc82fdsihll6svpk16sujkg.apps.googleusercontent.com'
                    )
                }
                ]
            } as SocialAuthServiceConfig,
        }
    ],
    bootstrap: [
        AppComponent
    ]
})
export class AppModule {
}
