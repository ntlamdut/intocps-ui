import {Component, Input, OnInit, NgZone} from "@angular/core";
import {MultiModelConfig} from "../../intocps-configurations/MultiModelConfig";
import IntoCpsApp from "../../IntoCpsApp";

@Component({
    selector: "mm-configuration",
    templateUrl: "./angular2-app/mm/mm-configuration.component.html"
})
export class MmConfigurationComponent extends OnInit {
    @Input()
    path:string;

    private config:MultiModelConfig;

    constructor(private zone:NgZone) {

    }

    ngOnInit() {
        let project = IntoCpsApp.getInstance().getActiveProject();

        MultiModelConfig
            .parse(this.path, project.getFmusPath())
            .then(config => this.zone.run(() => this.config = config));
    }

    onSubmit() {
        this.config.save();
    }

    addFmu() {
        throw "not implemented";
    }
}