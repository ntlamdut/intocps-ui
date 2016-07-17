import {FormControl} from "@angular/forms";

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
        return {invalidDouble: true};
}

export function integerValidator(control: FormControl): { [s: string]: boolean } {
    if (!isInteger(control.value))
        return {invalidInteger: true};
}

export function higherThanValidator(otherName:string) {
    return (control: FormControl) => {
        let other = control.root.find(otherName);

        if (other && Number(control.value) <= Number(other.value)) {
            return {notHigherThan:true};
        }
    }
}

export function lowerThanValidator(otherName:string) {
    return (control: FormControl) => {
        let other = control.root.find(otherName);

        if (other && Number(control.value) >= Number(other.value)) {
            return {notLowerThan:true};
        }
    }
}