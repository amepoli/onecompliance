import { Pipe, PipeTransform } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { FieldConfig } from '../interfaces';

@Pipe({ name: 'octranslate' })
export class OCTranslatePipe implements PipeTransform {

    constructor(private _translateService: TranslateService,) { }

    /**
     * Transform
     *
     * @param {any} value
     * @returns {string}
     */
    transform(value: any): string {
        if (value.translate) {
            return this._translateService.instant(value.translate);
        } else {
            return value.label || value.name || value.title || value.message ;
        }

    }
}
