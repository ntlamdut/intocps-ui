import {OnInit, Component, Input, NgZone} from "@angular/core";

import {PanelComponent} from "../shared/panel.component";
import {TrOverviewComponent, subObjectClass} from "./tr-overview.component";

@Component({
    selector: "tr-fmu",
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

        this.findAllMainObjects = "match(n{type:'fmu'}) return n.uri, n.path ";
 
        this.subObjectClasses.push(this.buildSubObjectFile());
        this.updatemainObjects();
    }
    buildSubObjectFile():subObjectClass{
        let subObj = new subObjectClass;
        subObj.name = "Requirements";
        subObj.subObjectPropertyName1 = "Date";
        subObj.subObjectPropertyName2 = "URI";
        subObj.subObjectPropertyID1 = "activity.time";
        subObj.subObjectPropertyID2 = "element.uri";

        subObj.findAllSubObjectsPart1 = "match(activity)<-[:Trace{name:\"prov:wasGeneratedBy\"}]-({uri:'";
        subObj.findAllSubObjectsPart2 = "'})-[:Trace{name:\"oslc:satisfies\"}]->(element) return element.uri, element.hash, activity.time, element.type order by activity.time desc";
        return subObj;
    }
}        
