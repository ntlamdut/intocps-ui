import {Component, Input} from "@angular/core";
import {BoundedDifferenceConstraint} from "../../../intocps-configurations/CoSimulationConfig";
import {Instance} from "../models/Fmu";

@Component({
    selector: 'bounded-difference',
    templateUrl: "./angular2-app/coe/inputs/bounded-difference.component.html",
})
export class BoundedDifferenceComponent {
    @Input()
    constraint:BoundedDifferenceConstraint;

    @Input()
    fmuInstances:Array<Instance>;
}