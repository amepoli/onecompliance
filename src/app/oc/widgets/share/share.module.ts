import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatBadgeModule } from "@angular/material/badge";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule as MatCardModule } from "@angular/material/card";
import { MatOptionModule as MatOptionModule } from "@angular/material/core";
import { MatDialogModule } from "@angular/material/dialog";
import { MatFormFieldModule as MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule as MatInputModule } from "@angular/material/input";
import { MatMenuModule } from "@angular/material/menu";
import { MatProgressSpinnerModule as MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSelectModule as MatSelectModule } from "@angular/material/select";
import { MatTabsModule as MatTabsModule } from "@angular/material/tabs";
import { MatToolbarModule } from "@angular/material/toolbar";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { ShareComponent } from "./share.component";
import { MatTooltipModule as MatTooltipModule } from "@angular/material/tooltip";
import { OneComplianceDirectivesModule } from "app/oc/directives/directives.module";

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatMenuModule,
        MatToolbarModule,
        MatTabsModule,
        MatIconModule,
        MatButtonModule,
        MatFormFieldModule,
        MatOptionModule,
        MatSelectModule,
        MatInputModule,
        MatCardModule,
        MatProgressSpinnerModule,
        MatBadgeModule,
        MatDialogModule,
        MatTooltipModule,
        OneComplianceDirectivesModule,
    ],
    exports: [ShareComponent],
    declarations: [ShareComponent],
})
export class ShareModule {}
