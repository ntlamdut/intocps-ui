import {Component, Input, OnInit} from "@angular/core";
import {FileSystemService} from "../shared/file-system.service";
import {CoeSimulationService} from "./coe-simulation.service";
import {CoeConfigurationComponent} from "./coe-configuration.component";
import {LineChartComponent} from "../shared/line-chart.component";

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

            <progress [value]="coeSimulation.progress" max="100"></progress>
    
            <line-chart [datasets]="coeSimulation.datasets"></line-chart>
        </div>
    </div>
`
})
export class CoeComponent implements OnInit {
    @Input()
    path:string;

    config:any;

    constructor(private fileSystem:FileSystemService,
                private coeSimulation:CoeSimulationService) {

    }

    ngOnInit():any {
        this.fileSystem
            .readFile(this.path)
            .then(content => this.config = JSON.parse(content));
    }

    runSimulation() {
        this.coeSimulation.run(this.config);
    }
}