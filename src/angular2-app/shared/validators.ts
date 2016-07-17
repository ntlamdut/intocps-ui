import {FormControl, FormArray, FormGroup} from "@angular/forms";

function isString(x:any) {
    return typeof x === 'string';
}

function isNumber(x:any) {
    let number = Number(x);

    return !isNaN(number) && isFinite(number);
}

function isInteger(x:any) {
    let number = Number(x);

    // TODO: It sees 1.0000000000000001 as an integer, due to floating point rounding error.
    return !isNaN(number) && isFinite(number) && number % 1 === 0;
}

export function numberValidator(control: FormControl): { [s: string]: boolean } {
    if (!isNumber(control.value))
        return {invalidNumber: true};
}

export function integerValidator(control: FormControl): { [s: string]: boolean } {
    if (!isInteger(control.value))
        return {invalidInteger: true};
}

export function lengthValidator(min: number = null, max: number = null) {
    return (control: FormControl) => {
        let length = control.value.length;

        if (length === undefined || min !== null && length < min || max !== null && length > max)
            return {invalidLength: true};
    }
}

export function uniqueGroupPropertyValidator(propertyName: string) {
    return (control: FormArray) => {
        for(let i = 0; i < control.length; i++) {
            let group:FormGroup = <FormGroup> control.at(i);
            let value = group.controls[propertyName].value;

            for(let j = i+1; j < control.length; j++) {
                let other:FormGroup = <FormGroup> control.at(j);
                let otherValue = other.controls[propertyName].value;

                if (value === otherValue)
                    return {notUnique: value};
            }
        }
    }
}

export function lessThanValidator(selfName:string, otherName:string) {
    return (group: FormGroup) => {
        let self = group.find(selfName);
        let other = group.find(otherName);

        if (self && other && Number(self.value) >= Number(other.value)) {
            return {notLessThan:true};
        }
    }
}