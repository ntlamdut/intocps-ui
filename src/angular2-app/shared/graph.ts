import { BehaviorSubject } from "rxjs/Rx";
import { CoSimulationConfig, LiveGraph } from "../../intocps-configurations/CoSimulationConfig";
import { SettingsService, SettingKeys } from "../shared/settings.service";
import { Serializer } from "../../intocps-configurations/Parser";

export class Graph {
    private config: CoSimulationConfig;
    graphMap: Map<LiveGraph, BehaviorSubject<Array<any>>> = new Map();
    private counter: number = 0;
    private graphMaxDataPoints: number = 100;
    private webSocket: WebSocket;
    private external = false;
    private progressCallback: (n: number) => void;


    public setProgressCallback(progressCallback?: (n: number) => void) {
        if (progressCallback)
            this.progressCallback = progressCallback;
    }

    public setExternal(external: boolean) { this.external = external; }

    public setGraphMaxDataPoints(graphMaxDataPoints: number, ) {
        this.graphMaxDataPoints = graphMaxDataPoints;
    }

    public setCoSimConfig(config: CoSimulationConfig) {
        this.config = config;
    }

    public reset() {
        this.graphMap.clear();
    }

    public getDataset(graph: LiveGraph): BehaviorSubject<Array<any>> {
        return this.graphMap.get(graph);
    }

    public getGraphs(): LiveGraph[] {
        return Array.from(this.graphMap.keys());
    }
    public getInternalGraphs() : LiveGraph[] {
        return Array.from(this.graphMap.keys()).filter((x: LiveGraph) => { return !x.externalWindow; });
    }

    public initializeSingleDataset(g: LiveGraph) {
        this.graphMap.clear();
        let ds = new BehaviorSubject([]);
        this.graphMap.set(g, ds);
        this.getGraphs();
        let datasets: Array<any> = [];
        g.getSerializedLiveStream().forEach((value: any, index: any) => {
            value.forEach((sv: any) => {
                let qualifiedName = index + "." + sv;
                datasets.push({
                    name: qualifiedName,
                    y: [],
                    x: []
                });
            });
        });
        ds.next(datasets);
    }
    public initializeDatasets() {
        this.graphMap.clear();

        this.config.liveGraphs.forEach(g => {

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
    public launchWebSocket(webSocket: string) {
        console.log("launching websocet: " + webSocket);
        this.counter = 0;
        this.webSocket = new WebSocket(webSocket);

        this.webSocket.addEventListener("error", event => console.error(event));
        this.webSocket.addEventListener("message", event => this.onMessage(event));
    }
    private onMessage(event: MessageEvent) {
        console.log("onMessage")
        let rawData = JSON.parse(event.data);
        let graphDatasets: Map<BehaviorSubject<Array<any>>, any> = new Map<BehaviorSubject<Array<any>>, any>();
        this.graphMap.forEach(ds => { graphDatasets.set(ds, ds.getValue()) });

        let newCOE = false;
        let xValue = this.counter++;
        //Preparing for new livestream messages. It has the following structure:
        // {"data":{"{integrate}":{"inst2":{"output":"0.0"}},"{sine}":{"sine":{"output":"0.0"}}},"time":0.0}}
        if ("time" in rawData) {
            xValue = rawData.time;
            if (this.progressCallback) {
                if (rawData.time < this.config.endTime) {
                    let pct = (rawData.time / this.config.endTime) * 100;
                    this.progressCallback(Math.round(pct));
                } else {
                    this.progressCallback(100);
                }
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

    public closeSocket() {
        this.webSocket.close();
    }
}