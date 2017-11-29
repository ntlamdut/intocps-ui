import {OnInit, Component, Input, NgZone} from "@angular/core";

import {PanelComponent} from "../shared/panel.component";
import {TrOverviewComponent, subObjectClass} from "./tr-overview.component";

@Component({
    selector: "tr-sim",
    directives: [
        PanelComponent,
        TrResultComponent],
    templateUrl: "./angular2-app/tr/tr-overview.component.html"
})


export class TrResultComponent extends TrOverviewComponent{
    constructor(zone:NgZone) {
        super(zone);
        this.mainObjectPropertyName1 = "Simulation Time";
        this.mainObjectPropertyName2 = "Result URI";
        this.mainObjectPropertyID1 = "m.time";
        this.mainObjectPropertyID2 = "n.uri";
        this.findAllMainObjects = "match (n{type:\"simulationResult\"})-[:Trace{name:\"prov:wasGeneratedBy\"}]->(m) return n.uri, m.time, m.type";

        this.subObjectClasses.push(this.buildSubObjectFile());
        this.updatemainObjects();
    }
    buildSubObjectFile():subObjectClass{
        let subObj = new subObjectClass();
        subObj.name = "Used Files";
        subObj.subObjectPropertyName1 = "Used File";
        subObj.subObjectPropertyName2 = "URI";
        subObj.subObjectPropertyID1 = "entity.path";
        subObj.subObjectPropertyID2 = "entity.uri";
        subObj.findAllSubObjectsPart1 = "match({uri:'";
        subObj.findAllSubObjectsPart2 = "'})-[:Trace{name:\"prov:wasGeneratedBy\"}]->(simulation)-[:Trace{name:\"prov:used\"}]-(entity) return entity.uri, entity.path, entity.hash";
        return subObj;
    }
}