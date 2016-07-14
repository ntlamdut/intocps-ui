import {Component, Input, NgZone, OnInit, OnDestroy} from "@angular/core";
import {CoSimulationConfig} from "../../intocps-configurations/CoSimulationConfig";
import {LineChartComponent} from "../shared/line-chart.component";
import {CoeSimulationService} from "./coe-simulation.service";
import {Http} from "@angular/http";
import {SettingsService, SettingKeys} from "../shared/settings.service";
import {coeServerStatusHandler} from "../../menus";
import IntoCpsApp from "../../IntoCpsApp";

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
    private _path:string;

    @Input()
    set path(path:string) {
        this._path = path;

        if (path) {
            this.parseConfig();

            if(this.coeSimulation)
                this.coeSimulation.reset();
        }
    }
    get path():string {
        return this._path;
    }

    online:boolean = false;
    url:string = '';
    version:string = '';
    config:CoSimulationConfig;

    private onlineInterval:number;

    constructor(
        private coeSimulation:CoeSimulationService,
        private http:Http,
        private zone:NgZone,
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

    parseConfig() {
        let project = IntoCpsApp.getInstance().getActiveProject();

        CoSimulationConfig
            .parse(this.path, project.getRootFilePath(), project.getFmusPath())
            .then(config => this.zone.run(() => this.config = config));
    }

    runSimulation() {
        this.coeSimulation.run(this.config);
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