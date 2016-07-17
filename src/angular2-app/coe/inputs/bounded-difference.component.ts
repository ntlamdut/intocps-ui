import {Component, Input} from "@angular/core";
import {FormGroup, FormArray, FormControl, FORM_DIRECTIVES, REACTIVE_FORM_DIRECTIVES} from "@angular/forms";
import {BoundedDifferenceConstraint} from "../../../intocps-configurations/CoSimulationConfig";
import {InstanceScalarPair} from "../models/Fmu";

@Component({
    selector: 'bounded-difference',
    templateUrl: "./angular2-app/coe/inputs/bounded-difference.component.html",
    directives: [FORM_DIRECTIVES, REACTIVE_FORM_DIRECTIVES]
})
export class BoundedDifferenceComponent {
    @Input()
    constraint:BoundedDifferenceConstraint;

    @Input()
    ports:Array<InstanceScalarPair> = [];

    @Input()
    formGroup:FormGroup;

    @Input()
    editing:boolean = false;

    customTrackBy(index:number, obj: any):any {
        return index;
    }

    addPort() {
        this.constraint.ports.push(this.ports[0]);

        let formControl = <FormControl> this.formGroup.find('ports');
        formControl.updateValueAndValidity();
    }

    removePort(port:InstanceScalarPair) {
        this.constraint.ports.splice(this.constraint.ports.indexOf(port), 1);

        let formControl = <FormControl> this.formGroup.find('ports');
        formControl.updateValueAndValidity();
    }
}