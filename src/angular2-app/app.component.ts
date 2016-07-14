import { Component, OnInit, NgZone } from '@angular/core';
import {FileSystemService} from "./shared/file-system.service";
import {CoePageComponent} from "./coe/coe-page.component";
import {HTTP_PROVIDERS} from "@angular/http";
import {SettingsService} from "./shared/settings.service";
import {MmPageComponent} from "./mm/mm-page.component";
import {CoSimulationConfig} from "../intocps-configurations/CoSimulationConfig";
import IntoCpsApp from "../IntoCpsApp";
import {MultiModelConfig} from "../intocps-configurations/MultiModelConfig";

interface MyWindow extends Window {
    ng2app: AppComponent;
}

declare let window: MyWindow;

// Main application component.
// Handles routing between the pages that use Angular 2.

@Component({
    selector: 'app',
    directives: [
        MmPageComponent,
        CoePageComponent
    ],
    providers: [
        HTTP_PROVIDERS,
        FileSystemService,
        SettingsService
    ],
    template: `
        <mm-page *ngIf="page === 'multiModel'" [config]="config"></mm-page>
        <coe-page *ngIf="page === 'coe'" [config]="config"></coe-page>`
})
export class AppComponent implements OnInit {
    private page:string;
    private config:CoSimulationConfig | MultiModelConfig;

    constructor(private zone:NgZone) {

    }

    ngOnInit() {
        // Expose the Angular 2 application for the rest of the INTO-CPS application
        window.ng2app = this;
    }

    openCOE(path: string):void {
        let project = IntoCpsApp.getInstance().getActiveProject();

        CoSimulationConfig
            .parse(path, project.getRootFilePath(), project.getFmusPath())
            .then(config => {
                this.zone.run(() => {
                    this.config = config;
                    this.page = 'coe';
                });
            });
    }

    openMultiModel(path: string):void {
        let project = IntoCpsApp.getInstance().getActiveProject();

        MultiModelConfig
            .parse(path, project.getFmusPath())
            .then(config => {
                this.zone.run(() => {
                    this.config = config;
                    this.page = 'multiModel';
                });
            });
    }

    closeAll():void {
        this.zone.run(() => {
            this.config = null;
            this.page = null;
        });
    }
}