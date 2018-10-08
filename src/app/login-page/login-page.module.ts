import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatInputModule } from '@angular/material';

import { FuseSharedModule } from '@fuse/shared.module';

import { LoginPageComponent } from 'app/login-page/login-page.component';

import { AmplifyAngularModule} from 'aws-amplify-angular';

const routes = [
    {
        path     : 'login',
        component: LoginPageComponent
    }
];

@NgModule({
    declarations: [
        LoginPageComponent
    ],
    imports     : [
        RouterModule.forChild(routes),

        MatButtonModule,
        MatCheckboxModule,
        MatFormFieldModule,
        MatInputModule,
        AmplifyAngularModule,
        FuseSharedModule
    ],
    exports     : [
        LoginPageComponent
    ]
})
export class LoginPageModule
{
}
