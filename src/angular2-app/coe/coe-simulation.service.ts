import { FileSystemService } from "../shared/file-system.service";
import { SettingsService, SettingKeys } from "../shared/settings.service";
import { Http, Response } from "@angular/http";
import { Serializer } from "../../intocps-configurations/Parser";
import { Fmu } from "./models/Fmu";
import { CoeConfig } from "./models/CoeConfig";
import * as Path from "path";
import { BehaviorSubject } from "rxjs/Rx";
import { Injectable, NgZone } from "@angular/core";
import { CoSimulationConfig, LiveGraph } from "../../intocps-configurations/CoSimulationConfig";
import { storeResultCrc } from "../../intocps-configurations/ResultConfig";
import * as http from "http"
import * as fs from 'fs'
import * as child_process from 'child_process'
import { TraceMessager } from "../../traceability/trace-messenger"
import DialogHandler from "../../DialogHandler"


@Injectable()
export class CoeSimulationService {

    progress: number = 0;

    graphMap: Map<LiveGraph, BehaviorSubject<Array<any>>> = new Map();

    errorReport: (hasError: boolean, message: string) => void = function () { };
    simulationCompletedHandler: () => void = function () { };
    postProcessingOutputReport: (hasError: boolean, message: string) => void = function () { };

    private webSocket: WebSocket;
    private sessionId: number;
    private remoteCoe: boolean;
    private url: string;
    private resultDir: string;
    private config: CoSimulationConfig;
    private counter: number = 0;
    private graphMaxDataPoints: number = 100;

    constructor(private http: Http,
        private settings: SettingsService,
        private fileSystem: FileSystemService,
        private zone: NgZone) {
        this.graphMaxDataPoints = settings.get(SettingKeys.GRAPH_MAX_DATA_POINTS);
    }

    reset() {
        this.progress = 0;
        this.zone.run(() => {
            this.graphMap.clear();
        });
    }

    run(config: CoSimulationConfig, errorReport: (hasError: boolean, message: string) => void, simCompleted: () => void, postScriptOutputReport: (hasError: boolean, message: string) => void) {
        this.errorReport = errorReport;
        this.simulationCompletedHandler = simCompleted;
        this.config = config;
        this.postProcessingOutputReport = postScriptOutputReport;
        this.remoteCoe = this.settings.get(SettingKeys.COE_REMOTE_HOST);
        this.url = this.settings.get(SettingKeys.COE_URL);

        let currentDir = Path.dirname(this.config.sourcePath);
        let now = new Date();
        let nowAsUTC = new Date(Date.UTC(now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            now.getHours(),
            now.getMinutes(),
            now.getSeconds(),
            now.getMilliseconds()));

        let dateString = nowAsUTC.toISOString().replace(/-/gi, "_")
            .replace(/T/gi, "-")
            .replace(/Z/gi, "")
            .replace(/:/gi, "_")
            .replace(/\./gi, "_");
        this.resultDir = Path.normalize(`${currentDir}/R_${dateString}`);

        this.reset();
        this.initializeDatasets(config);
        this.createSession();
    }


    stop() {
        this.http.get(`http://${this.url}/stopsimulation/${this.sessionId}`)
            .subscribe((response: Response) => { }, (err: Response) => this.errorHandler(err));
    }

    public getDataset(graph: LiveGraph): BehaviorSubject<Array<any>> {
        return this.graphMap.get(graph);
    }

    public getGraphs(): LiveGraph[] {
        return Array.from(this.graphMap.keys());
    }

    private initializeDatasets(config: CoSimulationConfig) {

        this.graphMap.clear();

        config.liveGraphs.forEach(g => {

            let ds = new BehaviorSubject([]);
            this.graphMap.set(g, ds);

            let datasets: Array<any> = [];

            g.getLivestream().forEach((value: any, index: any) => {

                value.forEach((sv: any) => {
                    let qualifiedName = Serializer.getIdSv(index, sv);
                    datasets.push({
                        name: qualifiedName,
                        y: [],
                        x: []
                    })
                });
            });

            ds.next(datasets);
        });
    }

    private createSession() {
        this.errorReport(false, "");

        this.http.get(`http://${this.url}/createSession`)
            .subscribe((response: Response) => {
                this.sessionId = response.json().sessionId;
                this.uploadFmus();
            });
    }

    private uploadFmus() {

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
        let data = new CoeConfig(this.config, this.remoteCoe).toJSON();

        this.fileSystem.mkdir(this.resultDir)
            .then(() => this.fileSystem.writeFile(Path.join(this.resultDir, "config.json"), data))
            .then(() => {
                this.http.post(`http://${this.url}/initialize/${this.sessionId}`, data)
                    .subscribe(() => this.simulate(), (err: Response) => this.errorHandler(err));
            });
    }

    private simulate() {


        // this.counter = 0;
        // this.webSocket = new WebSocket(`ws://${this.url}/attachSession/${this.sessionId}`);

        // this.webSocket.addEventListener("error", event => console.error(event));
        // this.webSocket.addEventListener("message", event => this.onMessage(event));

        // var message: any = {
        //     startTime: this.config.startTime,
        //     endTime: this.config.endTime,
        //     reportProgress: true,
        //     liveLogInterval: this.config.livestreamInterval
        // };

        // // enable logging for all log categories        
        // var logCategories: any = new Object();
        // let self = this;
        // this.config.multiModel.fmuInstances.forEach(instance => {
        //     let key: any = instance.fmu.name + "." + instance.name;

        //     if (self.config.enableAllLogCategoriesPerInstance) {
        //         logCategories[key] = instance.fmu.logCategories;
        //     }
        // });
        // Object.assign(message, { logLevels: logCategories });

        // let data = JSON.stringify(message);

        // this.fileSystem.writeFile(Path.join(this.resultDir, "config-simulation.json"), data)
        //     .then(() => {
        //         this.http.post(`http://${this.url}/simulate/${this.sessionId}`, data)
        //             .subscribe(() => this.downloadResults(), (err: Response) => this.errorHandler(err));
        //     });

        let dh = new DialogHandler("angular2-app/coe/graph-window/graph-window.html", 800, 600,null,null,null);
        dh.openWindow("ws://" + this.url + "/attachSession/" + this.sessionId ,true);
    }

    errorHandler(err: Response) {
        console.warn(err);
        this.progress = 0;
        this.errorReport(true, "Error: " + err.text());

    }

    private onMessage(event: MessageEvent) {

        let rawData = JSON.parse(event.data);
        let graphDatasets: Map<BehaviorSubject<Array<any>>, any> = new Map<BehaviorSubject<Array<any>>, any>();
        this.graphMap.forEach(ds => { graphDatasets.set(ds, ds.getValue()) });


        let newCOE = false;
        let xValue = this.counter++;
        //Preparing for new livestream messages. It has the following structure:
        // {"data":{"{integrate}":{"inst2":{"output":"0.0"}},"{sine}":{"sine":{"output":"0.0"}}},"time":0.0}}
        if ("time" in rawData) {
            xValue = rawData.time;

            if (rawData.time < this.config.endTime) {
                let pct = (rawData.time / this.config.endTime) * 100;
                this.progress = Math.round(pct);
            } else {
                this.progress = 100;
            }

            rawData = rawData.data;
        }

        Object.keys(rawData).forEach(fmuKey => {
            if (fmuKey.indexOf("{") !== 0) return;

            Object.keys(rawData[fmuKey]).forEach(instanceKey => {

                Object.keys(rawData[fmuKey][instanceKey]).forEach(outputKey => {
                    let value = rawData[fmuKey][instanceKey][outputKey];

                    if (value == "true") value = 1;
                    else if (value == "false") value = 0;

                    graphDatasets.forEach((ds: any, index: any) => {

                        let dataset = ds.find((dataset: any) => dataset.name === `${fmuKey}.${instanceKey}.${outputKey}`);
                        if (dataset) {
                            dataset.y.push(value);
                            dataset.x.push(xValue);
                            this.truncateDataset(dataset, this.graphMaxDataPoints);
                        }
                    })
                });
            });
        });

        graphDatasets.forEach((value: any, index: BehaviorSubject<any[]>) => {
            index.next(value);
        });
    }

    private truncateDataset(ds: any, maxLen: number) {
        let x: Number[] = <Number[]>ds.x;
        let size = x.length;
        if (size > maxLen) {
            ds.x = x.slice(size - maxLen, size)
            ds.y = ds.y.slice(size - maxLen, size)
        }
    }

    private downloadResults() {
        this.webSocket.close();
        this.simulationCompletedHandler();

        let resultPath = Path.normalize(`${this.resultDir}/outputs.csv`);
        let coeConfigPath = Path.normalize(`${this.resultDir}/coe.json`);
        let mmConfigPath = Path.normalize(`${this.resultDir}/mm.json`);
        let logPath = Path.normalize(`${this.resultDir}/log.zip`);

        this.http.get(`http://${this.url}/result/${this.sessionId}/plain`)
            .subscribe(response => {
                // Write results to disk and save a copy of the multi model and coe configs
                Promise.all([
                    this.fileSystem.writeFile(resultPath, response.text()),
                    this.fileSystem.copyFile(this.config.sourcePath, coeConfigPath),
                    this.fileSystem.copyFile(this.config.multiModel.sourcePath, mmConfigPath)
                ]).then(() => {
                    this.progress = 100;
                    storeResultCrc(resultPath, this.config);
                    this.executePostProcessingScript(resultPath);
                });
            });


        var logStream = fs.createWriteStream(logPath);
        let url = `http://${this.url}/result/${this.sessionId}/zip`;
        var request = http.get(url, (response: http.IncomingMessage) => {
            response.pipe(logStream);
            response.on('end', () => {

                // simulation completed + result
                let message = TraceMessager.submitSimulationResultMessage(this.config.sourcePath, this.config.multiModel.sourcePath, [resultPath, coeConfigPath, mmConfigPath, logPath]);
                let destroySessionUrl = `http://${this.url}/destroy/${this.sessionId}`;
                http.get(destroySessionUrl, (response: any) => {
                    let statusCode = response.statusCode;
                    if (statusCode != 200)
                        console.error("Destroy session returned statuscode: " + statusCode)
                });
            });
        });
    }

    private createPanel(title: string, content: HTMLElement): HTMLElement {
        var divPanel = document.createElement("div");
        divPanel.className = "panel panel-default";

        var divTitle = document.createElement("div");
        divTitle.className = "panel-heading";
        divTitle.innerText = title;

        var divBody = document.createElement("div");
        divBody.className = "panel-body";
        divBody.appendChild(content);

        divPanel.appendChild(divTitle);
        divPanel.appendChild(divBody);

        return divPanel;
    }

    private executePostProcessingScript(outputFile: string) {

        let script: string = this.config.postProcessingScript;
        let self = this;

        //default will be '.'
        if (script == null || script.length <= 1)
            return;


        let scriptNormalized = Path.normalize(Path.join(this.config.projectRoot, script));
        var scriptExists = false;
        try {
            fs.accessSync(scriptNormalized, fs.constants.R_OK);
            scriptExists = true;

        } catch (e) {

        }

        if (scriptExists) {
            script = scriptNormalized;
        }

        var spawn = child_process.spawn;

        var child = spawn(script, ["\"" + outputFile + "\"", "" + this.config.endTime], {
            detached: true,
            shell: true,
            cwd: Path.dirname(outputFile)
        });
        child.unref();

        child.stdout.on('data', function (data: any) {
            self.postProcessingOutputReport(false, data + "");
        });

        child.stderr.on('data', function (data: any) {
            console.log('stderr: ' + data);
            self.postProcessingOutputReport(true, data + "");
        });
    }


}