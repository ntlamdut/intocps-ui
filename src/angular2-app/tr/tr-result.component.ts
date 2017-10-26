import {OnInit, Component, Input, NgZone} from "@angular/core";

import {PanelComponent} from "../shared/panel.component";
import {TrOverviewComponent} from "./tr-overview.component";

@Component({
    selector: "tr-overview",
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
        this.mainObjectPropertyID3 = "m.type";

        this.subObjectPropertyName1 = "Used File";
        this.subObjectPropertyName2 = "URI";
        this.subObjectPropertyName3 = "Hash";
        this.subObjectPropertyID1 = "entity.path";
        this.subObjectPropertyID2 = "entity.uri";
        this.subObjectPropertyID3 = "entity.hash";

        this.findAllMainObjects = "match (n{type:\"simulationResult\"})-[:Trace{name:\"prov:wasGeneratedBy\"}]->(m) return n.uri, m.time, m.type";
        this.findAllSubObjectsPart1 = "match({uri:'";
        this.findAllSubObjectsPart2 = "'})-[:Trace{name:\"prov:wasGeneratedBy\"}]->(simulation)-[:Trace{name:\"prov:used\"}]-(entity) return entity.uri, entity.path, entity.hash";
        this.listSubObjectsName = "List simulation sources";
        this.updatemainObjects();
    }
}