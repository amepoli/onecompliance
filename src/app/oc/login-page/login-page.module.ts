import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatLegacyCheckboxModule as MatCheckboxModule } from '@angular/material/legacy-checkbox';
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';

import { FuseSharedModule } from '@fuse/shared.module';

import { LoginPageComponent } from './login-page.component';

import { AmplifyAngularModule } from 'aws-amplify-angular';

import { ReactiveFormsModule } from '@angular/forms';

const routes = [
    {
        path: 'login',
        component: LoginPageComponent
    },
    {
        path: 'login/:return_path',
        component: LoginPageComponent
    }
];

@NgModule({
    declarations: [
        LoginPageComponent
    ],
    imports: [
        RouterModule.forChild(routes),

        MatButtonModule,
        MatCheckboxModule,
        MatFormFieldModule,
        MatInputModule,
        AmplifyAngularModule,
        FuseSharedModule,
        ReactiveFormsModule
    ],
    exports: [
        LoginPageComponent
    ]
})
export class LoginPageModule {
}
