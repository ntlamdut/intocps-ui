///<reference path="../../typings/browser/ambient/github-electron/index.d.ts"/>
///<reference path="../../typings/browser/ambient/node/index.d.ts"/>
///<reference path="../../typings/browser/ambient/jquery/index.d.ts"/>
/// <reference path="../../node_modules/typescript/lib/lib.es6.d.ts" />

declare var Plotly:any;

import * as Main from  "../settings/settings"
import {IntoCpsApp} from  "../IntoCpsApp"
import {IntoCpsAppEvents} from "../IntoCpsAppEvents";
import * as Collections from 'typescript-collections';

import {CoeSimulationRunner} from './CoeSimulationRunner'
import {IProject} from "../proj/IProject";
import {SettingKeys} from "../settings/SettingKeys";
import {SourceDom} from "../sourceDom"
import {IViewController} from "../iViewController"

import {CoSimulationConfig, Serializer} from "../intocps-configurations/intocps-configurations";

import {TextInputNonLoad, TextInputIds} from "./components/text-input-non-load";
import {DropDownNonLoad} from "./components/dropdown-non-load";
import {Component} from "../multimodel/components/component";
import {FixedStep} from "./algorithms/fixed-step";
import * as Configs from "../intocps-configurations/intocps-configurations";
import {Utilities} from "../utilities";
import {LivestreamConfiguration} from "./livestream/livestream-config";

export class CoeController extends IViewController {

    coSimConfig: CoSimulationConfig = null;

    configButton: HTMLButtonElement;
    remote: Electron.Remote;
    dialog: Electron.Dialog;

    liveChart: any;

    enableDebugInfo: boolean = true;
    remoteCoe: boolean = false;

    private progressState: number = 0;

    private startTimeContainer: HTMLElement;
    private startTimeUI: TextInputNonLoad;

    private endTimeContainer: HTMLElement;
    private endTimeUI: TextInputNonLoad;

    private dropDownContainer: HTMLElement;
    private algorithmSelectUI: DropDownNonLoad;
    private algorithmPanel: HTMLElement;
    private algorithmTitle: HTMLHeadingElement;
    private algorithmPanelBody: HTMLElement;
    private algorithmController: Object;

    private saveButton: HTMLButtonElement;

    private livestreamPanelBody: HTMLElement;
    private livestreamConfiguration: LivestreamConfiguration;

    app: IntoCpsApp;

    constructor(viewDiv: HTMLDivElement) {
        super(viewDiv);
        this.remote = require("electron").remote;
        this.dialog = this.remote.dialog;
        this.app = IntoCpsApp.getInstance();
    }

    initialize(sourceDom: SourceDom): void {
        this.startTimeContainer = <HTMLElement>this.viewDiv.querySelector("#startTime");
        this.endTimeContainer = <HTMLElement>this.viewDiv.querySelector("#endTime");
        this.dropDownContainer = <HTMLElement>this.viewDiv.querySelector("#dropdown");
        this.algorithmPanel = <HTMLElement>this.viewDiv.querySelector("#algorithm-panel");
        this.algorithmTitle = <HTMLHeadingElement>this.algorithmPanel.querySelector("#algorithm-panel-title");
        this.algorithmPanelBody = <HTMLElement>this.algorithmPanel.querySelector("#algorithm-panel-body");
        this.saveButton = <HTMLButtonElement>this.viewDiv.querySelector("#coe-save-button");
        this.saveButton.onclick = this.onSaveClick.bind(this);
        this.livestreamPanelBody = <HTMLElement>this.viewDiv.querySelector("#livestream-config-panel-body");
        let self = this;

        IntoCpsApp.setTopName("Co-Simulation")
        this.readSettings();
        this.setProgress(0, null);
        this.initializeChart();

        let activeProject = this.app.getActiveProject();
        if (activeProject == null) {
            console.warn("no active project cannot load coe config");
        }

        CoSimulationConfig.parse(sourceDom.getPath(), activeProject.getRootFilePath(), activeProject.getFmusPath())
            .then(cc => {
                console.info("CC:"); console.info(cc);
                this.coSimConfig = cc;
                this.bindData();
                this.startTimeUI = new TextInputNonLoad(this.startTimeContainer, this.coSimConfig.startTime != null ? this.coSimConfig.startTime + "" : "0", this.startTimeChanged.bind(this), new TextInputIds());
                this.endTimeUI = new TextInputNonLoad(this.endTimeContainer, this.coSimConfig.endTime != null ? this.coSimConfig.endTime + "" : "1", this.endTimeChanged.bind(this), new TextInputIds());
                this.algorithmSelectUI = new DropDownNonLoad(this.dropDownContainer, ["Fixed step"], this.coSimConfig.algorithm != null ? "Fixed step" : null);
                this.algorithmSelectUI.setSelectionChangedHandler(this.algorithmOnChange.bind(this));
                if (this.coSimConfig.algorithm != null) {
                    this.algorithmOnChange("Fixed step", this.coSimConfig.algorithm);
                }
                $(this.livestreamPanelBody).load("coe/livestream/livestream-config.html", function (event: JQueryEventObject) {
                    self.livestreamConfiguration = new LivestreamConfiguration(this, self.coSimConfig.multiModel.fmuInstances, self.coSimConfig.livestream);
                });
            }).catch(e => console.error(e));


        checkCoeConnection("coe-status", getCoeUrl());
    }

    private onSaveClick(event: MouseEvent) {
        this.coSimConfig.save();
    }

    private readSettings() {
        this.enableDebugInfo = IntoCpsApp.getInstance().getSettings().getSetting(SettingKeys.COE_DEBUG_ENABLED);
        if (this.enableDebugInfo == undefined) {
            this.enableDebugInfo = false;
        }

        this.remoteCoe = IntoCpsApp.getInstance().getSettings().getSetting(SettingKeys.COE_REMOTE_HOST);
        if (this.remoteCoe == undefined) {
            this.remoteCoe = false;
        }
    }

    private startTimeChanged(text: string) {
        return Utilities.timeStringToNumberConversion(text, (val: number) => { this.coSimConfig.startTime = val; });
    }

    private endTimeChanged(text: string) {
        return Utilities.timeStringToNumberConversion(text, (val: number) => { this.coSimConfig.endTime = val; });
    }

    private algorithmOnChange(text: string, algorithm?: Configs.ICoSimAlgorithm) {
        Component.show(this.algorithmPanel);
        this.algorithmTitle.textContent = text;
        let self = this;
        if (text == "Fixed step") {
            $(this.algorithmPanelBody).load("coe/algorithms/fixed-step.html", function (event: JQueryEventObject) {
                if (algorithm == null) {
                    algorithm = new Configs.FixedStepAlgorithm();
                    self.coSimConfig.algorithm = algorithm;
                }

                this.algorithmController = new FixedStep(this, <Configs.FixedStepAlgorithm>algorithm);
            });
        }
    }
    private bindData() {
        //until bind is implemented we do this manual sync
        // (<HTMLInputElement>document.getElementById("input-sim-time-start")).value = this.coSimConfig.startTime + "";
        // (<HTMLInputElement>document.getElementById("input-sim-time-end")).value = this.coSimConfig.endTime + "";

        //        (<HTMLInputElement>document.getElementById("input-sim-algorithm-fixed-size")).value = (<Configs.FixedStepAlgorithm>this.coeConfig.algorithm).size + "";
        this.clearInfoMessages();
    }

    private clearInfoMessages() {
        var div = <HTMLElement>document.getElementById("simulation-info");
        while (div.hasChildNodes()) {
            div.removeChild(div.lastChild);
        }
    }





    initializeChart() {
        var d3 = Plotly.d3;

        var gd3 = d3.select('#graphContainer')
            .style({
                width: '100%',
                height: '80vh'
            });

        var gd = gd3.node();

        var layout = {
            xaxis: {
                showgrid: false,
                zeroline: false
            },
            yaxis: {
                showline: false
            }
        };

        Plotly
            .newPlot(gd, [], layout, {showLink: false})
            .then((element:any) => this.liveChart = element);

        window.addEventListener('resize', e => Plotly.Plots.resize(gd));
    }


    //Set the progress bar 
    setProgress(progress: number, message: string) {

        var divProgress = <HTMLInputElement>document.getElementById("coe-progress");
        let tmp = progress.toString() + "%";

        divProgress.style.width = tmp;
        if (message != null) {
            divProgress.innerHTML = tmp + " - " + message;
        } else {
            divProgress.innerHTML = tmp;
        }
        this.progressState = progress;
    }

    //sets the progress message but leaves the progress unchanged
    setProgressMessage(message: string) {
        this.setProgress(this.progressState, message);
    }

    setDebugMessage(message: string) {

        if (this.enableDebugInfo) {

            var div = <HTMLInputElement>document.getElementById("simulation-info");

            var divStatus = document.createElement("div");
            divStatus.className = "alert alert-info";
            divStatus.innerHTML = message;
            div.appendChild(divStatus);
        }
    }

    setErrorMessage(message: string) {

        var div = <HTMLInputElement>document.getElementById("simulation-info");

        var divStatus = document.createElement("div");
        divStatus.className = "alert alert-danger";
        divStatus.innerHTML = message;
        div.appendChild(divStatus);

    }

    private simulationCompleted(success: boolean, message: string) {
        if (!success) {
            this.setErrorMessage(message);
        }
        else {
            var div = <HTMLInputElement>document.getElementById("simulation-info");

            var divStatus = document.createElement("div");
            divStatus.className = "alert alert-success";
            divStatus.innerHTML = "Simulation Completed: " + message;
            div.appendChild(divStatus);
            IntoCpsApp.getInstance().emit(IntoCpsAppEvents.PROJECT_CHANGED);//TODO: we could downgrade this to resource added
        }
    }

    initializeChartDatasets(coSimConfig: CoSimulationConfig): string[] {
        var ids: string[] = [];

        coSimConfig.livestream.forEach((value, index) => {
            value.forEach(sv => ids.push(Serializer.getIdSv(index, sv)));
        });

        this.liveChart.data = ids.map(id => {
            return {name: id, y: []};
        });

        Plotly.redraw(this.liveChart);

        console.info("Livestream ids:");
        console.info(ids);
        return ids;
    }


    //validate the coesstings config
    validate(): boolean {
        //TODO
        return true;
    }





    public simulate() {

        if (!this.validate()) {
            console.warn("Unable to launch simulation due to invalid COE config.");
            console.warn(this.coSimConfig);
            return;
        }

        this.clearInfoMessages();

        let self = this;

        let url = getCoeUrl();

        let coeRunner = new CoeSimulationRunner(this.app.getActiveProject(),
            this.coSimConfig,
            this.remoteCoe,
            url,
            this.setProgress,
            this.setProgressMessage,
            () => self.liveChart,
            (coSimConfig: CoSimulationConfig) => { return self.initializeChartDatasets(self.coSimConfig); },
            (m) => { this.setDebugMessage(m) },
            this.setErrorMessage,
            (s, m) => this.simulationCompleted(s, m));
        coeRunner.runSimulation();
    }

}


export function checkCoeConnection(id: string, url: string) {

   return new Promise<void>(resolve => {
        let p = $.getJSON("http://" + url + "/version");
        setTimeout(function () { p.abort(); }, 1500);
        p.fail(function (err: any) {
            var div = <HTMLInputElement>document.getElementById(id);
            clearCoeStatus(id);

            var divStatus = document.createElement("div");
            divStatus.className = "alert alert-danger";
            divStatus.innerHTML = "Co-Simulation Engine, offline no connection at: " + url;
            div.appendChild(divStatus);

            setTimeout(function () {
                checkCoeConnection(id, url);
            }, 5000);

        })
            .done(function (data: any) {
                var div = <HTMLInputElement>document.getElementById(id);
                clearCoeStatus(id);
                var divStatus = document.createElement("div");
                divStatus.className = "alert alert-success";//alert alert-info
                divStatus.innerHTML = "Co-Simulation Engine, version: " + data.version + ", online at: " + url;
                div.appendChild(divStatus);

                var simulationPaneDiv = <HTMLElement>document.getElementById("simulation-pane");
                simulationPaneDiv.style.visibility = "visible";


            }).always(function () {
                console.info("always connection check");
            })
    });
}


function clearCoeStatus(id: string) {
    var div = <HTMLElement>document.getElementById(id);
    while (div.hasChildNodes()) {
        div.removeChild(div.lastChild);
    }
}


export function getCoeUrl(): string {
    let url = IntoCpsApp.getInstance().getSettings().getSetting(SettingKeys.COE_URL);

    if (url == null) {
        url = "localhost:8082";
    }
    return url;
}
