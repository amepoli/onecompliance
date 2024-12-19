import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule as MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule as MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule as MatInputModule } from '@angular/material/input';

import { StartPageComponent } from './start-page.component';

import { AmplifyAngularModule } from 'aws-amplify-angular';

import { ReactiveFormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';

const routes = [
    {
        path: '',
        component: StartPageComponent
    }
];

@NgModule({
    declarations: [
        StartPageComponent
    ],
    imports: [
        RouterModule.forChild(routes),

        MatButtonModule,
        MatCheckboxModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatToolbarModule,
        AmplifyAngularModule,
        ReactiveFormsModule
    ],
    exports: [
        StartPageComponent
    ]
})
export class StartPageModule {
}
