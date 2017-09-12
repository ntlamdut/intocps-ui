import {Component, Input} from "@angular/core";
import {FormArray, FormControl, FormGroup, FORM_DIRECTIVES, REACTIVE_FORM_DIRECTIVES} from "@angular/forms";
import {FmuMaxStepSizeConstraint} from "../../../intocps-configurations/CoSimulationConfig";


@Component({
    selector: 'fmu-max-step-size',
    templateUrl: "./angular2-app/coe/inputs/fmu-max-step-size.component.html",
    directives: [FORM_DIRECTIVES, REACTIVE_FORM_DIRECTIVES]
})
export class FmuMaxStepSizeComponent {
    @Input()
    constraint:FmuMaxStepSizeConstraint;

    @Input()
    formGroup:FormGroup;

    @Input()
    editing:boolean = false;

    customTrackBy(index:number, obj: any):any {
        return index;
    }
}