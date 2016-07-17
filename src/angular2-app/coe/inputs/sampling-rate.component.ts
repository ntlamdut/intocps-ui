import {Component, Input} from "@angular/core";
import {FormGroup, FORM_DIRECTIVES, REACTIVE_FORM_DIRECTIVES} from "@angular/forms";
import {SamplingRateConstraint} from "../../../intocps-configurations/CoSimulationConfig";

@Component({
    selector: 'sampling-rate',
    templateUrl: "./angular2-app/coe/inputs/sampling-rate.component.html",
    directives: [FORM_DIRECTIVES, REACTIVE_FORM_DIRECTIVES]
})
export class SamplingRateComponent {
    @Input()
    constraint:SamplingRateConstraint;

    @Input()
    editing:boolean = false;

    @Input()
    formGroup:FormGroup;
}