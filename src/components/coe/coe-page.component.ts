import {Component, Input} from "@angular/core";
import {CoeConfigurationComponent} from "./coe-configuration.component";
import {CoeSimulationComponent} from "./coe-simulation.component";

@Component({
    selector: "coe",
    templateUrl: "./components/coe/coe-page.component.html",
    directives: [
        CoeConfigurationComponent,
        CoeSimulationComponent
    ]
})
export class CoePageComponent {
    @Input()
    path:string;
}