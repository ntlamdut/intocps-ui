import {OnInit, Component, Input, NgZone} from "@angular/core";
import {MultiModelConfig} from "../../intocps-configurations/MultiModelConfig";
import IntoCpsApp from "../../IntoCpsApp";
import {IProject} from "../../proj/IProject";
import {Serializer} from "../../intocps-configurations/Parser";
import {InstanceScalarPair, OutputConnectionsPair} from "../coe/models/Fmu";

@Component({
    selector: "mm-overview",
    templateUrl: "./angular2-app/mm/mm-overview.component.html"
})
export class MmOverviewComponent implements OnInit {
    @Input()
    path:string;

    private config:MultiModelConfig;

    constructor(private zone:NgZone) {

    }

    ngOnInit() {
        let project:IProject = IntoCpsApp.getInstance().getActiveProject();

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