import {OnInit, Component, Input, NgZone} from "@angular/core";
//import {MultiModelConfig} from "../../intocps-configurations/MultiModelConfig";
//import {Serializer} from "../../intocps-configurations/Parser";
import IntoCpsApp from "../../IntoCpsApp";

export class TrOverviewComponent{
    public mainObjectPropertyName1:string;
    public mainObjectPropertyName2:string;
    public mainObjectPropertyID1:string;
    public mainObjectPropertyID2:string;
    public mainObjectPropertyID3:string;

    public subObjectPropertyName1:string;
    public subObjectPropertyName2:string;
    public subObjectPropertyName3:string;
    public subObjectPropertyID1:string;
    public subObjectPropertyID2:string;
    public subObjectPropertyID3:string;

    public findAllMainObjects:string;
    public findAllSubObjectsPart1:string;
    public findAllSubObjectsPart2:string;


    public mainObjecList:Array<subObject>;
    public subObjecList:Array<subObject>;
    private intoApp:IntoCpsApp;
    private zone:NgZone;
    private resultsAvailible:Boolean;
    private sourcesAvailible:Boolean;
    public _findSourcesFor:subObject;

    constructor(zone:NgZone) {
        this.resultsAvailible = false;
        this.sourcesAvailible = false;
        this.zone = zone;
        this.intoApp = IntoCpsApp.getInstance();
    }
    @Input()
    set findSourcesFor(findSourcesFor:subObject) {
        this._findSourcesFor = findSourcesFor;
        if (findSourcesFor.listSources){
            findSourcesFor.listSources = false;
        }else{
            for(var resInd in this.mainObjecList){
                this.mainObjecList[resInd].listSources = false;
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
        return this.mainObjecList;
    }


    protected updatemainObjects(){
        this.resultsAvailible = false;
        this.mainObjecList = Array<subObject>();
        this.intoApp.trmanager.sendCypherQuery(this.findAllMainObjects)
            .then(this.parsemainObjects.bind(this));
    }

    private getSourceQuery(startUri:string):string{
        return this.findAllSubObjectsPart1 + startUri + this.findAllSubObjectsPart2;
    }

    private updateSources(){
        this.sourcesAvailible = false;
        this.subObjecList = Array<subObject>();
        this.intoApp.trmanager.sendCypherQuery(this.getSourceQuery(this._findSourcesFor.subObjectProperty2))
            .then(this.parseSourceResults.bind(this));
    }

    private parsemainObjects(results: any[]){
        for(var result in results){
            this.mainObjecList.push(new subObject(results[result], this.mainObjectPropertyID1, this.mainObjectPropertyID2, this.mainObjectPropertyID3));
        }
        this.zone.run(() => this.resultsAvailible = true);
    }

    private parseSourceResults(results: any){
        for(var result in results){
            this.subObjecList.push(new subObject(results[result], this.subObjectPropertyID1, this.subObjectPropertyID2, this.subObjectPropertyID3));
        }
        this.zone.run(() => this.sourcesAvailible = true);
    }

}

class subObject {
    public listSources:Boolean;
    public subObjectPropertyID1:string;
    public subObjectPropertyID2:string;
    public subObjectPropertyID3:string;
    public subObjectProperty1:string;
    public subObjectProperty2:string;
    public subObjectProperty3:string;
    constructor(resultObject:any, subObjectPropertyID1:string, subObjectPropertyID2:string, subObjectPropertyID3:string){
        this.subObjectPropertyID1 = subObjectPropertyID1;
        this.subObjectPropertyID2 = subObjectPropertyID2;
        this.subObjectPropertyID3 = subObjectPropertyID3;
        this.subObjectProperty1 = resultObject[this.subObjectPropertyID1];
        this.subObjectProperty2 = resultObject[this.subObjectPropertyID2];
        this.subObjectProperty3 = resultObject[this.subObjectPropertyID3];
        this.listSources = false;
    }
    
}
