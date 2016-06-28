import {Component, Input, NgZone, OnInit} from "@angular/core";
import {CoeSimulationService} from "./coe-simulation.service";
import {CoeConfigurationComponent} from "./coe-configuration.component";
import {LineChartComponent} from "../shared/line-chart.component";
import {CoSimulationConfig} from "../../intocps-configurations/CoSimulationConfig";
import IntoCpsApp from "../../IntoCpsApp";
import {Http} from "@angular/http";
import {SettingsService, SettingKeys} from "../shared/settings.service";
import {coeServerStatusHandler} from "../../menus";

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
            <div *ngIf="!online" class="alert alert-danger">
                Co-Simulation Engine offline. No connection at {{url}}.
                <button class="btn btn-primary" (click)="onCoeLaunchClick()">Launch</button>
            </div>
            <div *ngIf="online" class="alert alert-success">
                Co-Simulation Engine, version {{version}}, online at {{url}}.
            </div>
        
            <div class="form-group">
                <button [disabled]="!online" (click)="runSimulation()" class="btn btn-default">
                    <span class="glyphicon glyphicon-play"></span> Simulate
                </button>
            </div>

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
export class CoeComponent implements OnInit {
    @Input()
    path:string;

    online:boolean = false;
    url:string = '';
    version:string = '';

    constructor(
        private coeSimulation:CoeSimulationService,
        private zone:NgZone,
        private http:Http,
        private settings:SettingsService
    ) {

    }

    ngOnInit() {
        this.url = this.settings.get(SettingKeys.COE_URL) || "localhost:8082";
        setInterval(() => this.isCoeOnline(), 2000);
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

    isCoeOnline() {
        this.http
            .get(`http://${this.url}/version`)
            .timeout(2000)
            .map(response => response.json())
            .subscribe((data:any) => {
                this.online = true;
                this.version = data.version;
            }, () => this.online = false);
    }

    onCoeLaunchClick() {
        coeServerStatusHandler.openWindow("autolaunch");
    }
}