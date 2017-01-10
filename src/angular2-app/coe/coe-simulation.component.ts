import {Component, Input, NgZone, OnInit, OnDestroy} from "@angular/core";
import {CoSimulationConfig} from "../../intocps-configurations/CoSimulationConfig";
import {LineChartComponent} from "../shared/line-chart.component";
import {CoeSimulationService} from "./coe-simulation.service";
import {Http} from "@angular/http";
import {SettingsService, SettingKeys} from "../shared/settings.service";
import IntoCpsApp from "../../IntoCpsApp";
import {WarningMessage} from "../../intocps-configurations/Messages";
import {openCOEServerStatusWindow} from "../../menus"

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
    hasHttpError:boolean = false;
    httpErrorMessage:string='';
    url:string = '';
    version:string = '';
    config:CoSimulationConfig;
    mmWarnings:WarningMessage[] = [];
    coeWarnings:WarningMessage[] = [];

    private onlineInterval:number;
    private parsing:boolean = false;

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
        this.parsing = true;

        CoSimulationConfig
            .parse(this.path, project.getRootFilePath(), project.getFmusPath())
            .then(config => this.zone.run(() => {
                this.config = config;

                this.mmWarnings = this.config.multiModel.validate();
                this.coeWarnings = this.config.validate();

                this.parsing = false;
            }));
    }

    canRun() {
        return this.online
            && this.mmWarnings.length === 0
            && this.coeWarnings.length === 0
            && !this.parsing;
    }

    runSimulation() {
        this.zone.run(() => {
        this.hasHttpError = false;});
        this.coeSimulation.run(this.config,(e,m)=>{this.zone.run(() => {this.errorHandler(e,m)})});

    }

    errorHandler(hasError:boolean, message:string){
      
        this.hasHttpError = hasError;
        this.httpErrorMessage = message;
      
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
        openCOEServerStatusWindow("autolaunch")
    }
}