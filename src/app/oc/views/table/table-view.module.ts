import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AmplifyAngularModule } from 'aws-amplify-angular';
import { MatTableModule as MatTableModule } from '@angular/material/table';
import { MatFormFieldModule as MatFormFieldModule } from '@angular/material/form-field';
import { MatPaginatorModule as MatPaginatorModule } from '@angular/material/paginator';
import { MatInputModule as MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule as MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule as MatCardModule } from '@angular/material/card';
import { MatSlideToggleModule as MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule as MatCheckboxModule } from '@angular/material/checkbox';
import { TableViewComponent } from './table-view.component';
import { DynamicFormsModule} from '../../dynamic-forms/dynamic-forms.module';
import { FormViewModule } from '../form/form-view.module';
import { OneCompliancePipesModule } from 'app/oc/pipes/pipes.module';
import { TableMultiselectToolbarModule } from '../table-multiselect-toolbar/table-multiselect-toolbar.module';
import { MatTooltipModule as MatTooltipModule } from '@angular/material/tooltip';
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
