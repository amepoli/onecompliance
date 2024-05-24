import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';

import { FuseSearchBarModule, FuseShortcutsModule } from '@fuse/components';
import { FuseSharedModule } from '@fuse/shared.module';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule, MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { FormViewModule } from 'app/oc/views/form/form-view.module';
import { QuickAddDialogComponent } from './quickadd.dialog.component';
import { OneCompliancePipesModule } from 'app/oc/pipes/pipes.module';


@NgModule({
    providers: [
        { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { appearance: 'fill' } }
    ],
    declarations: [
        QuickAddDialogComponent
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
        OneCompliancePipesModule
    ],
    exports: [
        QuickAddDialogComponent
    ]
})
export class QuickAddDialogModule
{
}
