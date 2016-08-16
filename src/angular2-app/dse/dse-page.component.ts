import {Component, Input} from "@angular/core";
import {DseOverviewComponent} from "./dse-overview.component";
import {DseSimulationComponent} from "./dse-simulation.component";
import {PanelComponent} from "../shared/panel.component";

@Component({
    selector: "dse-page",
    templateUrl: "./angular2-app/dse/dse-page.component.html",
    directives: [
        PanelComponent,
        DseOverviewComponent,
        DseSimulationComponent
    ]
})
export class DsePageComponent {
    @Input()
    path:string;
}