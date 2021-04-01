import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

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
