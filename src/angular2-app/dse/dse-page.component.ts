import {Component, Input} from "@angular/core";
import {DseConfigurationComponent} from "./dse-configuration.component";
import {DseConfiguration} from "../../intocps-configurations/dse-configuration";
import IntoCpsApp from "../../IntoCpsApp";
import {PanelComponent} from "../shared/panel.component";

@Component({
    selector: "dse-page",
    directives: [
        PanelComponent,
        DseConfigurationComponent
    ],
    templateUrl: "./angular2-app/dse/dse-page.component.html"
})
export class DsePageComponent {
    @Input()
    path:string;
}