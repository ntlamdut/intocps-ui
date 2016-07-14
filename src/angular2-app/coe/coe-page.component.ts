import {Component, Input} from "@angular/core";
import {CoeConfigurationComponent} from "./coe-configuration.component";
import {CoeSimulationComponent} from "./coe-simulation.component";
import {CoSimulationConfig} from "../../intocps-configurations/CoSimulationConfig";
import IntoCpsApp from "../../IntoCpsApp";

@Component({
    selector: "coe-page",
    templateUrl: "./angular2-app/coe/coe-page.component.html",
    directives: [
        CoeConfigurationComponent,
        CoeSimulationComponent
    ]
})
export class CoePageComponent {
    private _config:CoSimulationConfig;

    @Input()
    set config(config:CoSimulationConfig) {
        this._config = config;

        if (config)
            IntoCpsApp.setTopName(config.sourcePath.split('\\').reverse()[1]);
    }
    get config():CoSimulationConfig {
        return this._config;
    }
}