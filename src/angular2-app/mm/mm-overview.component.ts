import {OnInit, Component, Input, NgZone} from "@angular/core";
import {MultiModelConfig} from "../../intocps-configurations/MultiModelConfig";
import {Serializer} from "../../intocps-configurations/Parser";
import {OutputConnectionsPair} from "../coe/models/Fmu";
import IntoCpsApp from "../../IntoCpsApp";

@Component({
    selector: "mm-overview",
    templateUrl: "./angular2-app/mm/mm-overview.component.html"
})
export class MmOverviewComponent {
    private _path:string;

    @Input()
    set path(path:string) {
        this._path = path;

        if (path)
            this.parseConfig();
    }
    get path():string {
        return this._path;
    }

    private config:MultiModelConfig;

    constructor(private zone:NgZone) {

    }

    parseConfig() {
        let project = IntoCpsApp.getInstance().getActiveProject();

        MultiModelConfig
            .parse(this.path, project.getFmusPath())
            .then(config => this.zone.run(() => this.config = config));
    }

    getOutputs() {
        let outputs:OutputConnectionsPair[] = [];

        this.config.fmuInstances.forEach(instance => {
            instance.outputsTo.forEach((connections, scalarVariable) => {
                outputs.push(new OutputConnectionsPair(Serializer.getIdSv(instance, scalarVariable), connections));
            });
        });

        return outputs;
    }
}