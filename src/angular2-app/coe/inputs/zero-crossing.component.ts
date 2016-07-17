import {Component, Input} from "@angular/core";
import {FormArray, FormControl, FormGroup, FORM_DIRECTIVES, REACTIVE_FORM_DIRECTIVES} from "@angular/forms";
import {ZeroCrossingConstraint} from "../../../intocps-configurations/CoSimulationConfig";
import {InstanceScalarPair} from "../models/Fmu";

@Component({
    selector: 'zero-crossing',
    templateUrl: "./angular2-app/coe/inputs/zero-crossing.component.html",
    directives: [FORM_DIRECTIVES, REACTIVE_FORM_DIRECTIVES]
})
export class ZeroCrossingComponent {
    @Input()
    constraint:ZeroCrossingConstraint;

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