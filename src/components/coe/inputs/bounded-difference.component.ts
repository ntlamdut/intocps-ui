import {Component, Input} from "@angular/core";
import {BoundedDifferenceConstraint} from "../../../intocps-configurations/CoSimulationConfig";
import {Instance} from "../../../coe/fmi";

@Component({
    selector: 'bounded-difference',
    templateUrl: "./components/coe/inputs/bounded-difference.component.html",
})
export class BoundedDifferenceComponent {
    @Input()
    constraint:BoundedDifferenceConstraint;

    @Input()
    fmuInstances:Array<Instance>;
}