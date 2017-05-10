import {Component, Input} from "@angular/core";
import {DseSimulationComponent} from "./dse-simulation.component";
import {PanelComponent} from "../shared/panel.component";

@Component({
    selector: "dse-page",
    templateUrl: "./angular2-app/dse/dse-page.component.html",
    directives: [
        PanelComponent,
        DseSimulationComponent
    ]
})
export class DsePageComponent {
    @Input()
    path:string;
}