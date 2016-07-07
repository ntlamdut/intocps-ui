import {Component, Input} from "@angular/core";
import {ZeroCrossingConstraint} from "../../../intocps-configurations/CoSimulationConfig";
import {Instance} from "../../../coe/fmi";

@Component({
    selector: 'zero-crossing',
    templateUrl: "./components/coe/inputs/zero-crossing.component.html",
})
export class ZeroCrossingComponent {
    @Input()
    constraint:ZeroCrossingConstraint;

    @Input()
    fmuInstances:Array<Instance>;
}