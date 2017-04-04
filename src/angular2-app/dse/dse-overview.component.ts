import {OnInit, Component, Input, NgZone} from "@angular/core";
import {DseConfiguration, GeneticSearch, ExhaustiveSearch} from "../../intocps-configurations/dse-configuration";
import {Serializer} from "../../intocps-configurations/Parser";
import {OutputConnectionsPair} from "../coe/models/Fmu";
import IntoCpsApp from "../../IntoCpsApp";

@Component({
    selector: "dse-overview",
    templateUrl: "./angular2-app/dse/dse-overview.component.html"
})
export class DseOverviewComponent {
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

    private config:DseConfiguration;

    constructor(private zone:NgZone) {

    }

    parseConfig() {
       let project = IntoCpsApp.getInstance().getActiveProject();
    
       DseConfiguration
           .parse(this.path)
           .then(config => 
                this.zone.run(() => 
                this.config = config));
    }
}