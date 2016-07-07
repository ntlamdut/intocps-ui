import {Component, Input} from "@angular/core";
import {CoeConfigurationComponent} from "./coe-configuration.component";
import {CoeSimulationComponent} from "./coe-simulation.component";

@Component({
    selector: "multi-model-page",
    templateUrl: "./components/multi-model/multi-model-page.component.html",
})
export class MultiModelPageComponent {
    @Input()
    path:string;
}