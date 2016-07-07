import {Component, Input, NgZone, OnInit, OnDestroy} from "@angular/core";
import IntoCpsApp from "../../IntoCpsApp";
import {CoSimulationConfig} from "../../intocps-configurations/CoSimulationConfig";
import {LineChartComponent} from "../shared/line-chart.component";
import {CoeSimulationService} from "./coe-simulation.service";
import {Http} from "@angular/http";
import {SettingsService, SettingKeys} from "../shared/settings.service";
import {coeServerStatusHandler} from "../../menus";

@Component({
    selector: "coe-simulation",
    providers: [
        CoeSimulationService
    ],
    directives: [
        LineChartComponent
    ],
    templateUrl: "./angular2-app/coe/coe-simulation.component.html"
})
export class CoeSimulationComponent implements OnInit, OnDestroy {
    @Input()
    path:string;

    online:boolean = false;
    url:string = '';
    version:string = '';

    private onlineInterval:number;

    constructor(
        private coeSimulation:CoeSimulationService,
        private zone:NgZone,
        private http:Http,
        private settings:SettingsService
    ) {

    }

    ngOnInit() {
        this.url = this.settings.get(SettingKeys.COE_URL) || "localhost:8082";
        this.onlineInterval = setInterval(() => this.isCoeOnline(), 2000);
        this.isCoeOnline();
    }

    ngOnDestroy() {
        clearInterval(this.onlineInterval);
    }

    runSimulation() {
        let project = IntoCpsApp.getInstance().getActiveProject();

        CoSimulationConfig
            .parse(this.path, project.getRootFilePath(), project.getFmusPath())
            .then(config => this.zone.run(() => this.coeSimulation.run(config)));
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