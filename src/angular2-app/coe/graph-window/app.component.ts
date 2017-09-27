import { Component, OnInit, NgZone } from '@angular/core';
import { FileSystemService } from "../../shared/file-system.service";
import { HTTP_PROVIDERS, Http } from "@angular/http";
import { LineChartComponent } from "../../shared/line-chart.component";
import { BehaviorSubject } from "rxjs/Rx";
import { LiveGraph } from "../../../intocps-configurations/CoSimulationConfig";
import {Graph} from "../../shared/graph"


interface MyWindow extends Window {
    ng2app: AppComponent;
}

declare let window: MyWindow;

// Main application component.
// Handles routing between the pages that use Angular 2.

@Component({
    selector: 'app',
    directives: [LineChartComponent],
    providers: [
        HTTP_PROVIDERS,
        FileSystemService
    ],
    templateUrl: "./graph.component.html"
})
export class AppComponent implements OnInit {
    private url: string;
    private webSocket: WebSocket;
    private counter: number = 0;
    test: string = "BINDING WORKS";
    graph : Graph = new Graph();

    constructor(private http: Http,
        private fileSystem: FileSystemService,
        private zone: NgZone) {

    }

    initializeGraph(data: any) {
        console.log("Initialize graph");
        let dataObj = JSON.parse(data);
        this.zone.run(() => {
        this.graph.setGraphMaxDataPoints(dataObj.graphMaxDataPoints);
        let lg : LiveGraph = new LiveGraph();
        lg.fromObject(dataObj.livestream);
        console.log("initializeSingleDataset")
        this.graph.initializeSingleDataset(lg);
        console.log("launchwebsocket")
        this.graph.launchWebSocket(dataObj.webSocket)
        });
    }

    ngOnInit() {
        console.log("Angular initializing.")
    }
}