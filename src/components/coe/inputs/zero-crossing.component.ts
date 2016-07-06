import {Component, Input} from "@angular/core";
import {ZeroCrossingConstraint} from "../../../intocps-configurations/CoSimulationConfig";

@Component({
    selector: 'zero-crossing',
    templateUrl: "./components/coe/inputs/zero-crossing.component.html",
})
export class ZeroCrossingComponent {
    @Input()
    constraint:ZeroCrossingConstraint;
}