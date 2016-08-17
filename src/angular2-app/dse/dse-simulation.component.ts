import {Component, Input, NgZone, OnInit, OnDestroy} from "@angular/core";
import {CoSimulationConfig} from "../../intocps-configurations/CoSimulationConfig";
import {LineChartComponent} from "../shared/line-chart.component";
import {CoeSimulationService} from "../coe/coe-simulation.service";
import {Http} from "@angular/http";
import {SettingsService, SettingKeys} from "../shared/settings.service";
import {coeServerStatusHandler} from "../../menus";
import IntoCpsApp from "../../IntoCpsApp";
import {IProject} from "../../proj/IProject";
import {Project} from "../../proj/Project";
import {WarningMessage} from "../../intocps-configurations/Messages";
import * as Path from 'path';
import * as fs from 'fs';

@Component({
    selector: "dse-simulation",
    providers: [
        CoeSimulationService
    ],
    directives: [
    ],
    templateUrl: "./angular2-app/dse/dse-simulation.component.html"
})
export class DseSimulationComponent implements OnInit, OnDestroy {
    private _path:string;

    @Input()
    set path(path:string) {
        this._path = path;

        if (path) {
            let app: IntoCpsApp = IntoCpsApp.getInstance();
            let p: string = app.getActiveProject().getRootFilePath();
            this.cosimConfig = this.loadCosimConfigs(Path.join(p, Project.PATH_MULTI_MODELS));

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
    config:string = '';
    dseWarnings:WarningMessage[] = [];
    coeWarnings:WarningMessage[] = [];
    cosimConfig:string[] = [];

    private onlineInterval:number;
    
    constructor(
        private coeSimulation:CoeSimulationService,
        private http:Http,
        private zone:NgZone,
        private settings:SettingsService
    ) {

    }

    getFiles(path: string): string [] {
        var fileList: string[] = [];
        var files = fs.readdirSync(path);
        for(var i in files){
            var name = Path.join(path, files[i]);
            if (fs.statSync(name).isDirectory()){
                fileList = fileList.concat(this.getFiles(name));
            } else {
                fileList.push(name);
            }
        }
    
        return fileList;
    }

    loadCosimConfigs(path: string): string[] {
        var files: string[] = this.getFiles(path);
        return  files.filter(f => f.endsWith(".coe.json"));
    }

    experimentName(path: string): string {
        let elems = path.split(Path.sep);
        let mm: string = elems[elems.length-2];
        let ex: string = elems[elems.length-3];
        return mm + " | " + ex;
    }

    onConfigChange(config:string) {
        this.config = config;
    }

    ngOnInit() {
        this.url = this.settings.get(SettingKeys.COE_URL) || "localhost:8082";
        this.onlineInterval = setInterval(() => this.isCoeOnline(), 2000);
        this.isCoeOnline();
    }

    ngOnDestroy() {
        clearInterval(this.onlineInterval);
    }

    canRun() {
        return this.online
            && this.config != ""
            && this.dseWarnings.length === 0
            && this.coeWarnings.length === 0;
    }

    runDse() {
        var spawn = require('child_process').spawn;
        let installDir = IntoCpsApp.getInstance().getSettings().getValue(SettingKeys.INSTALL_TMP_DIR);

        let absoluteProjectPath = IntoCpsApp.getInstance().getActiveProject().getRootFilePath();
        let dseFile = this._path.split(Project.PATH_DSE);
        let experimentConfigName = Path.join(Project.PATH_DSE, dseFile[dseFile.length-1]);
        let configFile = this.config.split(Project.PATH_MULTI_MODELS);
        let multiModelConfigName = Path.join(Project.PATH_MULTI_MODELS, configFile[configFile.length-1]); 

        let scriptFile = Path.join(installDir, "dse", "Algorithm_exhaustive.py"); 
        var child = spawn("python", [scriptFile, absoluteProjectPath, experimentConfigName, multiModelConfigName], {
            detached: true,
            shell: false,
            // cwd: childCwd
        });
        child.unref();

        child.stdout.on('data', function (data: any) {
            console.log('dse/stdout: ' + data);
        });
        child.stderr.on('data', function (data: any) {
            console.log('dse/stderr: ' + data);
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