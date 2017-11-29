import {OnInit, Component, Input, NgZone} from "@angular/core";

import {PanelComponent} from "../shared/panel.component";
import {TrOverviewComponent, subObjectClass} from "./tr-overview.component";

@Component({
    selector: "tr-reqoneres",
    directives: [
        PanelComponent,
        ReqOneResultComponent],
    templateUrl: "./angular2-app/tr/tr-singlelist.component.html"
})


export class ReqOneResultComponent extends TrOverviewComponent{
    constructor(zone:NgZone) {
        super(zone);
        this.mainObjectPropertyName1 = "Path";
        this.mainObjectPropertyName2 = "URI";

        this.mainObjectPropertyID1 = "req.path";
        this.mainObjectPropertyID2 = "req.uri";

        this.findAllMainObjects = "match (req{type:'requirement'}) where (req)<-[:Trace{name:'oslc:verifies'}]-()  and not (req)<-[:Trace{name:'into:violates'}]-()  return req.uri, req.path";
 
        this.updatemainObjects();
    }
}        
