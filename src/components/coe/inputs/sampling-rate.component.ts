import {Component, Input} from "@angular/core";
import {SamplingRateConstraint} from "../../../intocps-configurations/CoSimulationConfig";

@Component({
    selector: 'sampling-rate',
    templateUrl: "./components/coe/inputs/sampling-rate.component.html",
})
export class SamplingRateComponent {
    @Input()
    constraint:SamplingRateConstraint;
}