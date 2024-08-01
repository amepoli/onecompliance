import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule as MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule as MatInputModule } from '@angular/material/input';

import { FuseSharedModule } from '@fuse/shared.module';

import { MailConfirmComponent } from './mail-confirm.component';

const routes = [
    {
        path     : 'mail-confirm',
        component: MailConfirmComponent
    }
];

@NgModule({
    declarations: [
        MailConfirmComponent
    ],
    imports     : [
        RouterModule.forChild(routes),

        MatIconModule,

        MatFormFieldModule,

        MatInputModule,

        MatButtonModule,

        FuseSharedModule
    ]
})
export class MailConfirmModule
{
}
