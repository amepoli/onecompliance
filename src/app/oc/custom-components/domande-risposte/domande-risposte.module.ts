import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule as MatCardModule } from '@angular/material/card';
import { MatOptionModule as MatOptionModule } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule as MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule as MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule as MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule as MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule as MatSelectModule } from '@angular/material/select';
import { MatTabsModule as MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { DynamicFormsModule} from '../../dynamic-forms/dynamic-forms.module';
import { DomandaRispostaComponent } from "./domanda-risposta/domanda-risposta.component";
import { DomandeRisposteComponent } from "./domande-risposte.component";
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { MaterialModule } from 'app/oc/dynamic-forms/material.module';
import { OneCompliancePipesModule } from 'app/oc/pipes/pipes.module';
import { OneComplianceDirectivesModule } from 'app/oc/directives/directives.module';

const routes = [
    {
        path: "oc/domande_risposte",
        component: DomandeRisposteComponent,
    },
];


@NgModule({
    imports: [
        CommonModule,
        // BrowserModule,
        RouterModule.forChild(routes),
        FormsModule,
        ReactiveFormsModule,
        DynamicFormsModule,
        MaterialModule,
        OneCompliancePipesModule,
        OneComplianceDirectivesModule

    ],
    exports: [
        DomandaRispostaComponent,
        DomandeRisposteComponent,
    ],
    declarations: [
        DomandaRispostaComponent,
        DomandeRisposteComponent,
    ]
})

export class DomandeRisposteModule { }
