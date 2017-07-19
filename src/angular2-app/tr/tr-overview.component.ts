import {OnInit, Component, Input, NgZone} from "@angular/core";
//import {MultiModelConfig} from "../../intocps-configurations/MultiModelConfig";
//import {Serializer} from "../../intocps-configurations/Parser";
import IntoCpsApp from "../../IntoCpsApp";
import {PanelComponent} from "../shared/panel.component";
const findAllSimQuery:string = "match (n{type:'simulationResult'})-[:prov_wgb]->(m) return n.uri, m.time, m.type";

@Component({
    selector: "tr-overview",
    directives: [
        PanelComponent,
        TrOverviewComponent],
    templateUrl: "./angular2-app/tr/tr-overview.component.html"
})


export class TrOverviewComponent{
    public simResultList:Array<simResult>;
    public sourceList:Array<simSource>;
    private intoApp:IntoCpsApp;
    private zone:NgZone;
    private resultsAvailible:Boolean;
    private sourcesAvailible:Boolean;
    public _findSourcesFor:simResult;

    constructor(zone:NgZone) {
        this.resultsAvailible = false;
        this.sourcesAvailible = false;
        this.zone = zone;
        this.intoApp = IntoCpsApp.getInstance();
        this.updateSimResults();
    }
    @Input()
    set findSourcesFor(findSourcesFor:simResult) {
        this._findSourcesFor = findSourcesFor;
        if (findSourcesFor.listSources){
            findSourcesFor.listSources = false;
        }else{
            for(var resInd in this.simResultList){
                this.simResultList[resInd].listSources = false;
            }
            findSourcesFor.listSources = true;
        }
        if (this._findSourcesFor)
            this.updateSources();
    }
    get findSourcesFor() {
        return this._findSourcesFor;
    }

    getResults(){
        return this.simResultList;
    }


    private updateSimResults(){
        this.resultsAvailible = false;
        this.simResultList = Array<simResult>();
        this.intoApp.trmanager.sendCypherQuery(findAllSimQuery)
            .then(this.parseSimResults.bind(this));
    }

    private getSourceQuery(startUri:string):string{
        return "match({uri:'" + startUri + "'})-[:prov_wgb]->(simulation)-[:prov_wgb|:prov_used]-(entity) return entity.uri, entity.path, entity.hash";
    }

    private updateSources(){
        this.sourcesAvailible = false;
        this.sourceList = Array<simSource>();
        this.intoApp.trmanager.sendCypherQuery(this.getSourceQuery(this._findSourcesFor.resultUri))
            .then(this.parseSourceResults.bind(this));
    }

    private parseSimResults(results: any[]){
        for(var result in results){
            this.simResultList.push(new simResult(results[result]));
        }
        this.zone.run(() => this.resultsAvailible = true);
    }

    private parseSourceResults(results: any){
        for(var result in results){
            this.sourceList.push(new simSource(results[result]));
        }
        this.zone.run(() => this.sourcesAvailible = true);
    }

}

class simSource {
    public uri:string;
    public path:string;
    public hash:string;
    constructor(resultObject:any){
        this.uri = resultObject["entity.uri"];
        this.path = resultObject["entity.path"];
        this.hash = resultObject["entity.hash"];
    }
    
}

class simResult {
    public listSources:Boolean;
    public time:string;
    public resultUri:string;
    public type:string;
    constructor(resultObject:any){
        this.time = resultObject["m.time"];
        this.resultUri = resultObject["n.uri"];
        this.type = resultObject["m.type"];
        this.listSources = false;
    }
    
}