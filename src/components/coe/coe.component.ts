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
    <div>{{coeSimulation.progress}}</div>
    <line-chart [datasets]="coeSimulation.datasets"></line-chart>
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