import { Component, OnInit, NgZone } from '@angular/core';
import { FileSystemService } from "../../shared/file-system.service";
import { HTTP_PROVIDERS, Http } from "@angular/http";
import { LineChartComponent } from "../../shared/line-chart.component";
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
    
    constructor(private http: Http,
        private fileSystem: FileSystemService,
        private zone: NgZone) {
    }   

    SetSocketUrl(url: string)
    {
        console.log("Url: " + url)
        this.url = url;
    }
    ngOnInit() {
        console.log("Angular initializing.")
    }
}