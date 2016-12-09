import { FileSystemService } from "../shared/file-system.service";
import { SettingsService, SettingKeys } from "../shared/settings.service";
import { Http, Response } from "@angular/http";
import { Serializer } from "../../intocps-configurations/Parser";
import { Fmu } from "./models/Fmu";
import { CoeConfig } from "./models/CoeConfig";
import * as Path from "path";
import { BehaviorSubject } from "rxjs/Rx";
import { Injectable, NgZone } from "@angular/core";
import { CoSimulationConfig } from "../../intocps-configurations/CoSimulationConfig";
import * as http from "http"


@Injectable()
export class CoeSimulationService {
    
    progress: number = 0;
    datasets: BehaviorSubject<Array<any>> = new BehaviorSubject([]);
    errorReport: (hasError: boolean, message: string) => void = function () { };

    private webSocket: WebSocket;
    private sessionId: number;
    private remoteCoe: boolean;
    private url: string;
    private resultDir: string;
    private config: CoSimulationConfig;
    private counter: number = 0;



    constructor(private http: Http,
        private settings: SettingsService,
        private fileSystem: FileSystemService,
        private zone: NgZone) {

    }

    reset() {
        this.progress = 0;
        this.datasets.next([]);
    }

    run(config: CoSimulationConfig, errorReport: (hasError: boolean, message: string) => void) {
        this.errorReport = errorReport;
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
        let datasets: Array<any> = [];

        this.config.livestream.forEach((value: any, index: any) => {
            value.forEach((sv: any) => {
                datasets.push({
                    name: Serializer.getIdSv(index, sv),
                    y: [],
                    x: []
                })
            });
        });

        this.datasets.next(datasets);
    }

    private createSession() {
        this.errorReport(false, "");
        this.progress = 0;

        this.http.get(`http://${this.url}/createSession`)
            .subscribe((response: Response) => {
                this.sessionId = response.json().sessionId;
                this.uploadFmus();
            });
    }

    private uploadFmus() {
        this.progress = 25;

        if (!this.remoteCoe) {
            this.initializeCoe();
            return;
        }

        let formData = new FormData();

        this.config.multiModel.fmus.forEach((value: Fmu) => {
            this.fileSystem.readFile(value.path).then(content => {
                formData.append(
                    'file',
                    new Blob([content], { type: "multipart/form-data" }),
                    value.path
                );
            });
        });

        this.http.post(`http://${this.url}/upload/${this.sessionId}`, formData)
            .subscribe(() => this.initializeCoe(), (err: Response) => this.errorHandler(err));
    }

    private initializeCoe() {
        this.progress = 50;

        let data = new CoeConfig(this.config, this.remoteCoe).toJSON();

        this.fileSystem.mkdir(this.resultDir)
            .then(() => this.fileSystem.writeFile(Path.join(this.resultDir, "config.json"), data))
            .then(() => {
                this.http.post(`http://${this.url}/initialize/${this.sessionId}`, data)
                    .subscribe(() => this.simulate(), (err: Response) => this.errorHandler(err));
            });
    }

    private simulate() {
        this.counter = 0;
        this.progress = 75;

        this.webSocket = new WebSocket(`ws://${this.url}/attachSession/${this.sessionId}`);

        this.webSocket.addEventListener("error", event => console.error(event));
        this.webSocket.addEventListener("message", event => this.zone.run(() => this.onMessage(event)));

        var message: any = { startTime: this.config.startTime, endTime: this.config.endTime };

        // enable logging for all log categories        
        var logCategories: any = new Object();
        let self = this;
        this.config.multiModel.fmuInstances.forEach(instance => {
            let key: any = instance.fmu.name + "." + instance.name;

            if (self.config.enableAllLogCategoriesPerInstance) {
                logCategories[key] = instance.fmu.logCategories;
            }
        });
        Object.assign(message, { logLevels: logCategories });

        let data = JSON.stringify(message);

        this.fileSystem.writeFile(Path.join(this.resultDir, "config-simulation.json"), data)
            .then(() => {
                this.http.post(`http://${this.url}/simulate/${this.sessionId}`, data)
                    .subscribe(() => this.downloadResults(), (err: Response) => this.errorHandler(err));
            });
    }

    errorHandler(err: Response) {
        console.warn(err);
        this.progress = 0;
        this.errorReport(true, "Error: " + err.text());

    }

    private onMessage(event: MessageEvent) {

        let rawData = JSON.parse(event.data);
        let datasets = this.datasets.getValue();
        let newCOE = false;
        let xValue = this.counter++;
        //Preparing for new livestream messages. It has the following structure:
        // {"data":{"{integrate}":{"inst2":{"output":"0.0"}},"{sine}":{"sine":{"output":"0.0"}}},"time":0.0}}
        if ("time" in rawData) {
            xValue = rawData.time;
            rawData = rawData.data;
        }

        Object.keys(rawData).forEach(fmuKey => {
            if (fmuKey.indexOf("{") !== 0) return;

            Object.keys(rawData[fmuKey]).forEach(instanceKey => {

                Object.keys(rawData[fmuKey][instanceKey]).forEach(outputKey => {
                    let value = rawData[fmuKey][instanceKey][outputKey];

                    if (value == "true") value = 1;
                    else if (value == "false") value = 0;
                    let dataset = datasets.find((dataset: any) => dataset.name === `${fmuKey}.${instanceKey}.${outputKey}`);
                    dataset.y.push(value);
                    dataset.x.push(xValue);
                });
            });
        });

        this.datasets.next(datasets);
    }

    private downloadResults() {
        this.webSocket.close();

        this.http.get(`http://${this.url}/result/${this.sessionId}/plain`)
            .subscribe(response => {
                // Write results to disk and save a copy of the multi model and coe configs
                Promise.all([
                    this.fileSystem.writeFile(Path.normalize(`${this.resultDir}/outputs.csv`), response.text()),
                    this.fileSystem.copyFile(this.config.sourcePath, Path.normalize(`${this.resultDir}/coe.json`)),
                    this.fileSystem.copyFile(this.config.multiModel.sourcePath, Path.normalize(`${this.resultDir}/mm.json`))
                ]).then(() => this.progress = 100);
            });

        
        var fs = require('fs');
        var file = fs.createWriteStream(`${this.resultDir}/log.zip`);
        let url = `http://${this.url}/result/${this.sessionId}/zip`;
        var request = http.get(url, (response:http.IncomingMessage) => {
            response.pipe(file);
            response.on('end', () =>{
                let destroySessionUrl = `http://${this.url}/destroy/${this.sessionId}`;
                http.get(destroySessionUrl, (response:any) => {
                    let statusCode = response.statusCode;
                    if(statusCode != 200)
                        console.error("Destroy session returned statuscode: " + statusCode)
                });
            });      
        });
    }


}