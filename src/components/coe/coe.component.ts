import {Component, Input, NgZone} from "@angular/core";
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
    <coe-configuration [path]="path"></coe-configuration>
   
    <div class="panel panel-default">
        <div class="panel-heading"><h3 class="panel-title">Simulation</h3></div>
        <div class="panel-body">
            <button (click)="runSimulation()" class="btn btn-default"><span class="glyphicon glyphicon-play"></span> Simulate</button>

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
    path:string;

    constructor(private coeSimulation:CoeSimulationService, private zone:NgZone) {

    }

    runSimulation() {
        let project = IntoCpsApp.getInstance().getActiveProject();

        CoSimulationConfig
            .parse(this.path, project.getRootFilePath(), project.getFmusPath())
            .then(config => {
                console.log(config);
                this.zone.run(() => this.coeSimulation.run(config));
            });
    }
}