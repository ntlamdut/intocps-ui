import {FormControl} from "@angular/forms";

export function doubleValidator(control: FormControl): { [s: string]: boolean } {
    let number = Number(control.value);

    if (number % 1 !== 0) {
        return {invalidDouble: true};
    }
}

export function integerValidator(control: FormControl): { [s: string]: boolean } {
    let number = Number(control.value);

    if (isNaN(number) || !isFinite(number) || Math.floor(number) !== number) {
        return {invalidInteger: true};
    }
}

export function higherThanValidator(otherName:string) {
    return (control: FormControl) => {
        let other = control.root.find(otherName);

        if (other && Number(control.value) <= Number(other.value)) {
            other.updateValueAndValidity();
            return {notHigherThan:true};
        }
    }
}

export function lowerThanValidator(otherName:string) {
    return (control: FormControl) => {
        let other = control.root.find(otherName);

        if (other && Number(control.value) >= Number(other.value)) {
            other.updateValueAndValidity();
            return {notLowerThan:true};
        }
    }
}