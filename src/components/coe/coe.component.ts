import {Component, Input, OnInit} from "@angular/core";
import {FileSystemService} from "../shared/file-system.service";
import {CoeSimulationService} from "./coe-simulation.service";
import {CoeConfigurationComponent} from "./coe-configuration.component";
import {LineChartComponent} from "../shared/line-chart.component";
import {CoSimulationConfig} from "../../intocps-configurations/CoSimulationConfig";
import IntoCpsApp from "../../IntoCpsApp";

@Component({
    selector: "coe",
    providers: [
        CoeSimulationService
    ],
    directives: [
        CoeConfigurationComponent,
        LineChartComponent
    ],
    template: `
    <coe-configuration [config]="config"></coe-configuration>
   
    <div class="panel panel-default">
        <div class="panel-heading"><h3 class="panel-title">Simulation</h3></div>
        <div class="panel-body">
            <button (click)="runSimulation()" class="btn btn-default btn-sm glyphicon glyphicon-play">Simulate</button>

            <div class="progress">
              <div class="progress-bar" [style.width]="coeSimulation.progress + '%'" style="min-width: 2em">
                {{coeSimulation.progress}}%
              </div>
            </div>
    
            <line-chart [datasets]="coeSimulation.datasets"></line-chart>
        </div>
    </div>
`
})
export class CoeComponent {
    @Input()
    set path(path:string) {
        let project = IntoCpsApp.getInstance().getActiveProject();

        CoSimulationConfig.parse(path, project.getRootFilePath(), project.getFmusPath())
            .then(config => this.config = config);
    }

    config:any;

    constructor(private coeSimulation:CoeSimulationService) {

    }

    runSimulation() {
        this.coeSimulation.run(this.config);
    }
}