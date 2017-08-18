import {OnInit, Component, Input, NgZone} from "@angular/core";
import * as Path from 'path';
import IntoCpsApp from "../../IntoCpsApp";

import {PanelComponent} from "../shared/panel.component";
import {TrOverviewComponent, subObject} from "./tr-overview.component";

@Component({
    selector: "tr-overview",
    directives: [
        PanelComponent,
        TrFUMsComponent],
    templateUrl: "./angular2-app/tr/tr-overview.component.html"
})


export class TrFUMsComponent extends TrOverviewComponent{
    private _path:string;
    
    @Input()
    set path(path:string) {
        this._path = path;
        if (path){
            var basePath:string = IntoCpsApp.getInstance().getActiveProject().getRootFilePath();
            this.updatemainObjects().then((function(basePath:string){
                this.mainObjecList.forEach((function(trObj:TrFUMsComponent, value:subObject){ 
                    var tempPath = Path.join(basePath, value.subObjectProperty1)
                    if (path.toLowerCase().endsWith(tempPath.toLowerCase())){
                        trObj.findSourcesFor = value;
                    }
                }).bind(null, this));
            }).bind(this, basePath));
        }
    }
    get path():string {
        return this._path;
    }

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

        this.findAllMainObjects = "match(n{type:'fmu'}) return n.uri, n.path";
        this.findAllSubObjectsPart1 = "match (activity)<-[:prov_wgb]-({uri:'";
        this.findAllSubObjectsPart2 = "'})-[:oslc_satisfies]->(element) return element.uri, element.hash, activity.time, element.type order by activity.time desc";
        this.listSubObjectsName = "List requirements";
        this.updatemainObjects();
    }
}