import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';

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
