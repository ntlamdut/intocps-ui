import {Component, Input} from "@angular/core";
import {ZeroCrossingConstraint} from "../../../intocps-configurations/CoSimulationConfig";
import {Instance} from "../models/Fmu";

@Component({
    selector: 'zero-crossing',
    templateUrl: "./angular2-app/coe/inputs/zero-crossing.component.html",
})
export class ZeroCrossingComponent {
    @Input()
    constraint:ZeroCrossingConstraint;

    @Input()
    fmuInstances:Array<Instance>;
}