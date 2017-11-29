import {OnInit, Component, Input, NgZone} from "@angular/core";

import {PanelComponent} from "../shared/panel.component";
import {TrOverviewComponent, subObjectClass} from "./tr-overview.component";

@Component({
    selector: "tr-reqnores",
    directives: [
        PanelComponent,
        ReqNoResultComponent],
    templateUrl: "./angular2-app/tr/tr-singlelist.component.html"
})


export class ReqNoResultComponent extends TrOverviewComponent{
    constructor(zone:NgZone) {
        super(zone);
        this.mainObjectPropertyName1 = "Path";
        this.mainObjectPropertyName2 = "URI";
        this.mainObjectPropertyID1 = "req.path";
        this.mainObjectPropertyID2 = "req.uri";

        this.findAllMainObjects = "match (req{type:'requirement'}) where not (req)<-[:Trace{name:'into:violates'}]-() and not (req)<-[:Trace{name:'oslc:verifies'}]-()  return req.uri, req.path";
 
        this.updatemainObjects();
    }
}        
