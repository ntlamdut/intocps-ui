import {OnInit, Component, Input, NgZone} from "@angular/core";

import {PanelComponent} from "../shared/panel.component";
import {TrOverviewComponent, subObjectClass} from "./tr-overview.component";

@Component({
    selector: "tr-user",
    directives: [
        PanelComponent,
        TrUserComponent],
    templateUrl: "./angular2-app/tr/tr-overview.component.html"
})


export class TrUserComponent extends TrOverviewComponent{
    constructor(zone:NgZone) {
        super(zone);
        this.mainObjectPropertyName1 = "User Name";
        this.mainObjectPropertyName2 = "URI";
        this.mainObjectPropertyID1 = "usr.name";
        this.mainObjectPropertyID2 = "usr.uri";
        this.findAllMainObjects = "match (usr{specifier:\"prov:Agent\"}) return usr.name, usr.email, usr.uri";
        
        this.subObjectClasses.push(this.buildSubObjectEntity());
        this.subObjectClasses.push(this.buildSubObjectActiviteis());
        this.updatemainObjects();
    }
    buildSubObjectEntity():subObjectClass{
        let subObj = new subObjectClass;
        subObj.name = "Artefacts";
        subObj.subObjectPropertyName1 = "Type";
        subObj.subObjectPropertyName2 = "URI";
        subObj.subObjectPropertyID1 = "entity.type";
        subObj.subObjectPropertyID2 = "entity.uri";
        subObj.findAllSubObjectsPart1 = "match (usr{uri:'";
        subObj.findAllSubObjectsPart2 = "'})<-[:Trace{name:\"prov:wasAttributedTo\"}]-(entity) return entity.uri, entity.type";
        return subObj;
    }
    buildSubObjectActiviteis():subObjectClass{
        let subObj = new subObjectClass;
        subObj.name = "Activities";
        subObj.subObjectPropertyName1 = "Type";
        subObj.subObjectPropertyName2 = "URI";
        subObj.subObjectPropertyID1 = "entity.type";
        subObj.subObjectPropertyID2 = "entity.uri";
        subObj.findAllSubObjectsPart1 = "match (usr{uri:'";
        subObj.findAllSubObjectsPart2 = "'})<-[:Trace{name:\"prov:wasAssociatedWith\"}]-(entity) return entity.uri, entity.type";
        return subObj;
    }

}