import {Component, Input} from "@angular/core";
import {CoeConfigurationComponent} from "./coe-configuration.component";
import {CoeSimulationComponent} from "./coe-simulation.component";
import {PanelComponent} from "../shared/panel.component";

@Component({
    selector: "coe-page",
    templateUrl: "./angular2-app/coe/coe-page.component.html",
    directives: [
        PanelComponent,
        CoeConfigurationComponent,
        CoeSimulationComponent
    ]
})
export class CoePageComponent {
    @Input()
    path:string;
}