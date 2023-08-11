import { Pipe, PipeTransform } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { FieldConfig } from '../interfaces';

@Pipe({ name: 'octranslate' })
export class OCTranslatePipe implements PipeTransform {

    constructor(private _translateService: TranslateService,) { }

    /**
     * Transform
     *
     * @param {FieldConfig} value
     * @returns {string}
     */
    transform(value: FieldConfig): string {
        if (value.translate) {
            return this._translateService.instant(value.translate);
        } else {
            return value.label;
        }

    }
}
