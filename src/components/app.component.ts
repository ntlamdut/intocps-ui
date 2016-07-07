import { Component, OnInit, NgZone } from '@angular/core';
import {FileSystemService} from "./shared/file-system.service";
import {CoePageComponent} from "./coe/coe-page.component";
import {HTTP_PROVIDERS} from "@angular/http";
import {SettingsService} from "./shared/settings.service";
import {MultiModelPageComponent} from "./multi-model/multi-model-page.component";

interface MyWindow extends Window {
    ng2app: AppComponent;
}

declare let window: MyWindow;

// Main application component.
// Handles routing between the pages that use Angular 2.

@Component({
    selector: 'app',
    directives: [
        MultiModelPageComponent,
        CoePageComponent
    ],
    providers: [
        HTTP_PROVIDERS,
        FileSystemService,
        SettingsService
    ],
    template: `
        <multi-model-page *ngIf="page === 'multiModel'" [path]="path"></multi-model-page>
        <coe-page *ngIf="page === 'coe'" [path]="path"></coe-page>`
})
export class AppComponent implements OnInit {
    private page:string;
    private path:string;

    constructor(private zone:NgZone) {

    }

    ngOnInit() {
        // Expose the Angular 2 application for the rest of the INTO-CPS application
        window.ng2app = this;
    }

    openCOE(path: string):void {
        this.zone.run(() => {
            this.path = path;
            this.page = 'coe';
        });
    }

    openMultiModel(path: string):void {
        this.zone.run(() => {
            this.path = path;
            this.page = 'multiModel';
        });
    }

    closeAll():void {
        this.zone.run(() => {
            this.path = '';
            this.page = '';
        });
    }
}