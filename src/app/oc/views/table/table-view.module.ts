import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AmplifyAngularModule } from 'aws-amplify-angular';
import { MatLegacyTableModule as MatTableModule } from '@angular/material/legacy-table';
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field';
import { MatLegacyPaginatorModule as MatPaginatorModule } from '@angular/material/legacy-paginator';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatLegacyProgressSpinnerModule as MatProgressSpinnerModule } from '@angular/material/legacy-progress-spinner';
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card';
import { MatLegacySlideToggleModule as MatSlideToggleModule } from '@angular/material/legacy-slide-toggle';
import { MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyCheckboxModule as MatCheckboxModule } from '@angular/material/legacy-checkbox';
import { TableViewComponent } from './table-view.component';
import { DynamicFormsModule} from '../../dynamic-forms/dynamic-forms.module';
import { FormViewModule } from '../form/form-view.module';
import { OneCompliancePipesModule } from 'app/oc/pipes/pipes.module';
import { TableMultiselectToolbarModule } from '../table-multiselect-toolbar/table-multiselect-toolbar.module';
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip';
import { DomChangeDirectiveModule } from 'app/oc/directives';
import { QuickAddDialogModule } from 'app/oc/dialogs/quickadd.dialog/quickadd.dialog.module';

@NgModule({
    declarations: [TableViewComponent],
    imports: [
        CommonModule,
        AmplifyAngularModule,
        MatTableModule,
        MatFormFieldModule,
        MatPaginatorModule,
        MatInputModule,
        MatProgressSpinnerModule,
        MatCardModule,
        MatSlideToggleModule,
        MatSortModule,
        MatIconModule,
        MatButtonModule,
        MatCheckboxModule,
        MatTooltipModule,
        DynamicFormsModule,
        FormViewModule,
        TableMultiselectToolbarModule,
        OneCompliancePipesModule,
        DomChangeDirectiveModule,
        QuickAddDialogModule
    ],
    exports: [
        CommonModule,
        AmplifyAngularModule,
        MatTableModule,
        MatFormFieldModule,
        MatPaginatorModule,
        MatInputModule,
        MatProgressSpinnerModule,
        MatCardModule,
        MatSlideToggleModule,
        MatSortModule,
        MatIconModule,
        MatButtonModule,
        MatCheckboxModule,
        DynamicFormsModule,
        TableViewComponent
    ]
})

export class TableViewModule { }
