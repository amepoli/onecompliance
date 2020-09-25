import { Injectable } from '@angular/core';
import { FormGroup, Validators } from '@angular/forms';

@Injectable({
    providedIn: 'root'
})
export class ValidationsService {


    /**
     * Constructor
     *
     */
    constructor() {
    }


    /**
     * Check and set input to required if required validation exists
     * @param validations
     * @returns required: boolean
     */
    public static checkIfRequired(validations) {
        let required = false;
        if (validations != null && validations.length > 0) {
            validations.forEach(validation => {
                if (validation.name === 'required') {
                    required = true;
                }
            });
        }
        return required;
    }

    /**
     * Bind validations
     * @param validations
     * @returns Validators
     */
    public static bindValidations(validations: any) {
        if (validations.length > 0) {
            const validList = [];
            validations.forEach(valid => {
                if (valid.name === 'minlength') {
                    validList.push(Validators.minLength(valid.value));
                }
                else if (valid.name === 'maxlength') {
                    validList.push(Validators.maxLength(valid.value));
                }
                else if (valid.name === 'min') {
                    validList.push(Validators.min(valid.value));
                }
                else if (valid.name === 'max') {
                    validList.push(Validators.max(valid.value));
                }
                else {
                    validList.push(valid.validator);
                }
            });
            return Validators.compose(validList);
        }
        return null;
    }

    /**
     * Process Form Validations
     * @param validations
     * @returns Validators
     */
    public static processFormValidations(validations) {
        for (const validator of validations) {
            if (validator['name'] === 'minlength') {
                validator['validator'] = Validators.minLength(validator['value']);
            }
            else if (validator['name'] === 'maxlength') {
                validator['validator'] = Validators.maxLength(validator['value']);
            }
            else if (validator['name'] === 'min') {
                validator['validator'] = Validators.min(validator['value']);
            }
            else if (validator['name'] === 'max') {
                validator['validator'] = Validators.max(validator['value']);
            }
            else if (validator['name'] === 'required') {
                validator['validator'] = Validators.required;
            }
            else if (validator['name'] === 'pattern') {
                validator['validator'] = Validators.pattern(validator['validator']);
            }
        }
        return validations;
    }

    /**
     * Validate all form fields
     * @param formGroup
     */
    public static validateAllFormFields(formGroup: FormGroup) {
        Object.keys(formGroup.controls).forEach(field => {
            const control = formGroup.get(field);
            control.markAsTouched({ onlySelf: true });
        });
    }

}

