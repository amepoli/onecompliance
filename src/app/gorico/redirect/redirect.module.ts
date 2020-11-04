import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { FuseSharedModule } from '@fuse/shared.module';

import { RedirectComponent } from './redirect.component';

import { AmplifyAngularModule } from 'aws-amplify-angular';

import { ReactiveFormsModule } from '@angular/forms';

const routes = [
    {
        path: 'redirect',
        component: RedirectComponent
    },
    {
        path: 'redirect/:return_path',
        component: RedirectComponent
    }
];

@NgModule({
    declarations: [
        RedirectComponent
    ],
    imports: [
        RouterModule.forChild(routes),
        AmplifyAngularModule,
        FuseSharedModule,
        ReactiveFormsModule
    ],
    exports: [
        RedirectComponent
    ]
})
export class RedirectModule {
}
