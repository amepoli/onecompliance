import { NgModule } from '@angular/core';
import { GenericTableModule } from '../generic-table/generic-table.module';
import { ArticlesComponent } from './articles.component';
import { RouterModule } from '@angular/router';

const routes = [
    {
        path     : 'gorico/articles',
        component: ArticlesComponent
    }
];

@NgModule({
    imports: [
        RouterModule.forChild(routes),
        GenericTableModule
      ],
      declarations: [ArticlesComponent]
})
export class ArticlesModule { }
