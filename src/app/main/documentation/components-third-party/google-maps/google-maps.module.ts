import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { FuseSharedModule } from '@fuse/shared.module';
import { FuseHighlightModule } from '@fuse/components/index';

import { DocsComponentsThirdPartyGoogleMapsComponent } from './google-maps.component';

const routes = [
    {
        path     : 'google-maps',
        component: DocsComponentsThirdPartyGoogleMapsComponent
    }
];

@NgModule({
    declarations: [
        DocsComponentsThirdPartyGoogleMapsComponent
    ],
    imports     : [
        RouterModule.forChild(routes),

        MatButtonModule,
        MatIconModule,

        FuseSharedModule,
        FuseHighlightModule
    ],
})
export class GoogleMapsModule
{
}
