import {Component, Input} from "@angular/core";
import {DseSimulationComponent} from "./dse-simulation.component";
import {DseOverviewComponent} from "./dse-overview.component";
import {PanelComponent} from "../shared/panel.component";
import {DseConfigurationComponent} from "./dse-configuration.component";

@Component({
    selector: "dse-page",
    directives: [
        PanelComponent,
        DseSimulationComponent,
        DseConfigurationComponent,
        DseOverviewComponent
    ],
    templateUrl: "./angular2-app/dse/dse-page.component.html"
})
export class DsePageComponent {
    @Input()
    path:string;
}