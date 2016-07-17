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
        let formArray = <FormArray> this.formGroup.find('ports');

        this.constraint.ports.push(this.ports[0]);
        formArray.push(new FormControl());
    }

    removePort(port:InstanceScalarPair) {
        let index = this.constraint.ports.indexOf(port);
        let formArray = <FormArray> this.formGroup.find('ports');

        this.constraint.ports.splice(index, 1);
        formArray.removeAt(index);
    }
}