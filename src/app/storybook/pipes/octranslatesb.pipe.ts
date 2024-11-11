import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'octranslatesb' })
export class OCTranslateSBPipe implements PipeTransform {

    constructor() { }

    /**
     * Transform
     *
     * @param {any} value
     * @returns {string}
     */
    transform(value: any): string {
        return value.translate || value.label || value.name || value.title || value.message;
    }
}
