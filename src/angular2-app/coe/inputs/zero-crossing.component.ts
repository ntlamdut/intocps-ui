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
        if (this.constraint.ports.length >= 2) return;

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