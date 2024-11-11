import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule as MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule as MatInputModule } from '@angular/material/input';

import { FuseSharedModule } from '@fuse/shared.module';

import { ChangePasswordComponent } from './change-password.component';

const routes = [
    {
        path     : 'change-password',
        component: ChangePasswordComponent
    }
];

@NgModule({
    declarations: [
        ChangePasswordComponent
    ],
    imports     : [
        RouterModule.forChild(routes),

        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,

        FuseSharedModule
    ]
})
export class ChangePasswordModule
{
}
