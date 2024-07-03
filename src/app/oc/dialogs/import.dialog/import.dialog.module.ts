import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatLegacyProgressSpinnerModule as MatProgressSpinnerModule } from '@angular/material/legacy-progress-spinner';
import { MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog';
import { MatIconModule } from '@angular/material/icon';
import { TableViewModule } from 'app/oc/views/table/table-view.module';
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card';
import { RouterModule } from '@angular/router';
import { BottomTabsModule } from 'app/oc/bottom-tabs/bottom-tabs.module';
import { ImportDialogComponent } from './import.dialog.component';
import { FormViewModule } from 'app/oc/views/form/form-view.module';
import { FormViewToolbarModule } from 'app/oc/views/form-view-toolbar/form-view-toolbar.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormGetterModule } from 'app/oc/views/form-getter/form-getter.module';


@NgModule({
    imports: [
        FormsModule,
        CommonModule,
        ReactiveFormsModule,
        MatProgressSpinnerModule,
        MatDialogModule,
        MatIconModule,
        MatButtonModule,
        MatCardModule,
        TableViewModule,
        FormGetterModule,
        FormViewModule,
        FormViewToolbarModule,
        BottomTabsModule,
        BottomTabsModule,
    ],
    exports: [
        ImportDialogComponent
    ],
    declarations: [ImportDialogComponent]
})

export class ImportDialogModule { }
