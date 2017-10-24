import {OnInit, Component, Input, NgZone} from "@angular/core";

import {PanelComponent} from "../shared/panel.component";
import {TrOverviewComponent} from "./tr-overview.component";

@Component({
    selector: "tr-overview",
    directives: [
        PanelComponent,
        TrFUMsComponent],
    templateUrl: "./angular2-app/tr/tr-overview.component.html"
})


export class TrFUMsComponent extends TrOverviewComponent{
    constructor(zone:NgZone) {
        super(zone);
        this.mainObjectPropertyName1 = "FMU Path";
        this.mainObjectPropertyName2 = "URI";
        this.mainObjectPropertyID1 = "n.path";
        this.mainObjectPropertyID2 = "n.uri";
        this.mainObjectPropertyID3 = "n.uri";

        this.subObjectPropertyName1 = "Date";
        this.subObjectPropertyName2 = "URI";
        this.subObjectPropertyName3 = "Type";
        this.subObjectPropertyID1 = "activity.time";
        this.subObjectPropertyID2 = "element.uri";
        this.subObjectPropertyID3 = "element.type";

        this.findAllMainObjects = "match(n{type:'fmu'}) return n.uri, n.path ";
        this.findAllSubObjectsPart1 = "(activity)<-[:TRACE{name:\"prov:wasGeneratedBy\"}]-({uri:'";
        this.findAllSubObjectsPart2 = "'})-[:TRACE{name:\"oslc:satisfies\"}]->(element) return element.uri, element.hash, activity.time, element.type order by activity.time desc";
        this.listSubObjectsName = "List requirements";
        this.updatemainObjects();
    }
}