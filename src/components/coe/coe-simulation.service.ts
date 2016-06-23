import {FileSystemService} from "../shared/file-system.service";
import {SettingsService, SettingKeys} from "../shared/settings.service";
import {Http, Response} from "@angular/http";
import {Serializer} from "../../intocps-configurations/Parser";
import {Fmu} from "../../coe/fmi";
import {CoeConfig} from "../../coe/CoeConfig";
import * as Path from "path";
import {BehaviorSubject} from "rxjs/Rx";
import {Injectable, NgZone} from "@angular/core";

@Injectable()
export class CoeSimulationService {
    progress:number = 0;
    datasets:BehaviorSubject<Array<any>> = new BehaviorSubject([]);

    private webSocket:WebSocket;
    private sessionId:number;
    private remoteCoe:boolean;
    private url:string;
    private resultDir:string;
    private config:any;

    constructor(private http:Http,
                private settings:SettingsService,
                private fileSystem:FileSystemService,
                private zone:NgZone) {

    }

    run(config:any) {
        this.config = config;
        this.remoteCoe = this.settings.get(SettingKeys.COE_REMOTE_HOST);
        this.url = this.settings.get(SettingKeys.COE_URL);

        let currentDir = Path.dirname(this.config.sourcePath);
        let dateString = new Date().toLocaleString().replace(/\//gi, "-").replace(/,/gi, "").replace(/ /gi, "_").replace(/:/gi, "-");
        this.resultDir = Path.normalize(`${currentDir}/R_${dateString}`);

        this.initializeDatasets();
        this.createSession();
    }

    private initializeDatasets() {
        let datasets:Array<any> = [];

        this.config.livestream.forEach((value:any, index:any) => {
            value.forEach((sv:any) => {
                datasets.push({
                    name: Serializer.getIdSv(index, sv),
                    y: []
                })
            });
        });

        this.datasets.next(datasets);
    }

    private createSession() {
        this.progress = 0;

        this.http.get(`http://${this.url}/createSession`)
            .subscribe((response:Response) => {
                this.sessionId = response.json().sessionId;
                this.uploadFmus();
            }, error => console.error(error));
    }

    private uploadFmus() {
        this.progress = 25;

        if (!this.remoteCoe) {
            this.initializeCoe();
            return;
        }

        let formData = new FormData();

        this.config.multiModel.fmus.forEach((value:Fmu) => {
            this.fileSystem.readFile(value.path).then(content => {
                formData.append(
                    'file',
                    new Blob([content], {type: "multipart/form-data"}),
                    value.path
                );
            });
        });

        this.http.post(`http://${this.url}/upload/${this.sessionId}`, formData)
            .subscribe(
                () => this.initializeCoe(),
                error => console.error(error)
            );
    }

    private initializeCoe() {
        this.progress = 50;

        let data = new CoeConfig(this.config, this.remoteCoe).toJSON();

        this.fileSystem.mkdir(this.resultDir)
            .then(() => this.fileSystem.writeFile(Path.join(this.resultDir, "config.json"), data))
            .then(() => {
                this.http.post(`http://${this.url}/initialize/${this.sessionId}`, data)
                    .subscribe(
                        () => this.simulate(),
                        error => console.error(error)
                    );
            });
    }

    private simulate() {
        this.progress = 75;

        this.webSocket = new WebSocket(`ws://${this.url}/attachSession/${this.sessionId}`);

        this.webSocket.addEventListener("error", event => console.error(event));
        this.webSocket.addEventListener("message", event => this.zone.run(() => this.onMessage(event)));

        let data = JSON.stringify({ startTime: this.config.startTime, endTime: this.config.endTime });

        this.fileSystem.writeFile(Path.join(this.resultDir, "config-simulation.json"), data)
            .then(() => {
                this.http.post(`http://${this.url}/simulate/${this.sessionId}`, data)
                    .subscribe(
                        () => this.downloadResults(),
                        error => console.error(error)
                    );
            });
    }

    private onMessage(event:MessageEvent) {
        let rawData = JSON.parse(event.data);
        let datasets = this.datasets.getValue();

        Object.keys(rawData).forEach(fmuKey => {
            if (fmuKey.indexOf("{") !== 0) return;

            Object.keys(rawData[fmuKey]).forEach(instanceKey => {

                Object.keys(rawData[fmuKey][instanceKey]).forEach(outputKey => {
                    let value = rawData[fmuKey][instanceKey][outputKey];

                    if (value == "true") value = 1;
                    else if (value == "false") value = 0;

                    datasets
                        .find((dataset:any) => dataset.name === `${fmuKey}.${instanceKey}.${outputKey}`)
                        .y.push(value);
                });
            });
        });

        this.datasets.next(datasets);
    }

    private downloadResults() {
        this.progress = 100;
        this.webSocket.close();

        this.http.get(`http://${this.url}/result/${this.sessionId}`)
            .subscribe(
                response => this.fileSystem.writeFile(Path.normalize(`${this.resultDir}/log.csv`), response.text()),
                error => console.error(error)
            );
    }
}