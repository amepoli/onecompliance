import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';

import { FuseSearchBarModule, FuseShortcutsModule } from '@fuse/components';
import { FuseSharedModule } from '@fuse/shared.module';

import { MenuOptionsCustomDialogComponent } from './menu-options-custom.dialog.component';
import { MatProgressSpinnerModule as MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule as MatFormFieldModule, MAT_FORM_FIELD_DEFAULT_OPTIONS as MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { MatInputModule as MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { FormGetterModule } from 'app/oc/views/form-getter/form-getter.module';
import { FormViewModule } from 'app/oc/views/form/form-view.module';


@NgModule({
    providers: [
        { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { appearance: 'fill' } }
    ],
    declarations: [
        MenuOptionsCustomDialogComponent
    ],
    imports: [
        CommonModule,
        RouterModule,
        MatButtonModule,
        MatIconModule,
        MatMenuModule,
        MatProgressSpinnerModule,
        MatToolbarModule,
        MatFormFieldModule,
        MatInputModule,
        FuseSharedModule,
        FuseSearchBarModule,
        FuseShortcutsModule,

        FormViewModule,
        FormGetterModule
    ],
    exports: [
        MenuOptionsCustomDialogComponent
    ]
})
export class MenuOptionsCustomDialogModule
{
}
