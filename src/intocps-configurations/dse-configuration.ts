import { FORM_DIRECTIVES, REACTIVE_FORM_DIRECTIVES, Validators, FormArray, FormControl, FormGroup } from "@angular/forms";
import { numberValidator } from "../angular2-app/shared/validators";
import * as fs from "fs"
import { DseParser } from "./dse-parser"
import { Fmu, ScalarVariableType, ScalarVariable} from "../angular2-app/coe/models/Fmu";
import {WarningMessage, ErrorMessage} from "./Messages";
import { MultiModelConfig } from "./MultiModelConfig"

export class DseConfiguration implements ISerializable {
    

    sourcePath: string;
    searchAlgorithm: IDseAlgorithm = new ExhaustiveSearch(); //set as default
    scenarios: DseScenario[] = [];
    objConst : DseObjectiveConstraint []= [];
    paramConst : DseParameterConstraint []= [];
    dseParameters : DseParameter[] =[];
    extScrObjectives : ExternalScript[] = [];
    intFunctObjectives : InternalFunction[] = [];
    ranking : IDseRanking = new ParetoRanking([]);

    coeConfig:string = '';   
    fmuRootPath:string ='';
    multiModel: MultiModelConfig;


    toObject() {
        let pConst : string [] = []; 
        this.paramConst.forEach(function(p) {
            pConst.push(p.constraint)
        });

        let oConst : string [] = []; 
        this.objConst.forEach(function(o) {
            oConst.push(o.constraint)
        });

        let scen : string [] = []; 
        this.scenarios.forEach(function(s) {
            scen.push(s.name)
        });

        let params : any = {};
        this.dseParameters.forEach((p:DseParameter) =>{
            params[p.param] = p.initialValues
        });

        let extScr : any = {};
        let intFunc : any = {}; //INTERNAL FUNCTIONS NOT YET SUPPORTED
        let objDefs : any = {};
        this.extScrObjectives.forEach((o:ExternalScript) =>{
            extScr[o.name] = o.toObject(); 
        });
        objDefs["externalScripts"] = extScr;
        objDefs["internalFunctions"] = intFunc;


        return {
            algorithm: this.searchAlgorithm.toObject(),
            objectiveConstraints: oConst,
            objectiveDefinitions: objDefs,
            parameterConstraints: pConst,
            parameters: params,
            ranking: this.ranking.toObject(),
            scenarios: scen
        }
    }


    public newSearchAlgortihm(sa:IDseAlgorithm){
        this.searchAlgorithm = sa;
    } 
    
    public addObjectiveConstraint(): DseObjectiveConstraint{
        let newOC = new DseObjectiveConstraint("");
        this.objConst.push(newOC);
        return newOC;
    }

    public newObjectiveConstraint(oc: DseObjectiveConstraint[]){
        this.objConst = oc;
    }


    public removeObjectiveConstraint(oc: DseObjectiveConstraint){
        this.objConst.splice(this.paramConst.indexOf(oc), 1);
    }

    getExtScrObjectives(obName : string) {
        return this.extScrObjectives.find(v => v.name == obName) || null;
    }

    public addParameterConstraint(): DseParameterConstraint{
        let newPC = new DseParameterConstraint("");
        this.paramConst.push(newPC);
        return newPC;
    }

    public newParameterConstraint(pc:DseParameterConstraint[]){
        this.paramConst = pc;
    }

    public removeParameterConstraint(pc:DseParameterConstraint){
        this.paramConst.splice(this.paramConst.indexOf(pc), 1);
    }

    public addParameter(){
        let param = new DseParameter("");
        this.dseParameters.push(param);
        return param;
    }

    getParameter(paramName: string){
        return this.dseParameters.find(v => v.param == paramName) || null;
    }
    
    public getParameterOrCreate(paramName: string) {
        let param = this.getParameter(paramName);

        //config does not contain this param
        if (!param) {
            param = new DseParameter(paramName)
            this.dseParameters.push(param);
        }
        return param;
    }

    public removeParameter(p:DseParameter){
        let index = this.dseParameters.indexOf(p);
        this.dseParameters.splice(index, 1);
    }

    public addExternalScript(){
        let es = new ExternalScript("","",[]);
        this.extScrObjectives.push(es);
        return es;
    }
    public newExternalScript(n:string, file:string, params : ObjectiveParam []){
         this.extScrObjectives.push(new ExternalScript(n, file, params));
    }

    public removeExternalScript(e:ExternalScript){
        let index = this.extScrObjectives.indexOf(e);
        this.extScrObjectives.splice(index, 1);
    }
    

    public newRanking(r: IDseRanking){
        this.ranking = r;
    }

    public newScenario(scen:DseScenario []){
         this.scenarios = scen;
    }

    public addScenario(): DseScenario{
        if(this.scenarios.length < 1){
            let newS = new DseScenario("");
            this.scenarios.push(newS);
            return newS;
        }
    }

    public removeScenario(s:DseScenario){
        this.scenarios.splice(this.scenarios.indexOf(s), 1);
    }


    static parse(path: string, projectRoot: string, fmuRootPath: string): Promise<DseConfiguration> {
        return new Promise<DseConfiguration>((resolve, reject) => {
            fs.access(path, fs.constants.R_OK, error => {
                if (error) return reject(error);
                fs.readFile(path, (error, content) => {
                    if (error) return reject(error);
                    this.create(path, projectRoot, fmuRootPath, JSON.parse(content.toString()))
                        .then(dseConfig => resolve(dseConfig))
                        .catch(error => reject(error));
                });
            });
        });
    }

    static create(path:string, projectRoot: string, fmuRootPath: string, data: any): Promise<DseConfiguration> {
        return new Promise<DseConfiguration>((resolve, reject) => {

            let parser = new DseParser();
            let configuration = new DseConfiguration();
            configuration.sourcePath = path;
            configuration.multiModel = null;

            configuration.fmuRootPath = fmuRootPath;
            parser.parseSearchAlgorithm(data, configuration);
            parser.parseScenarios(data, configuration);
            parser.parseObjectiveConstraint(data, configuration);
            parser.parseParameterConstraints(data, configuration);
            parser.parseParameters(data, configuration);
            parser.parseExtScrObjectives(data, configuration);
            parser.parseIntFuncsObjectives(data, configuration);
            parser.parseRanking(data,configuration);
            resolve(configuration)
        })

    }

    setMultiModel(mmPath: string): Promise<DseConfiguration> {
        return new Promise<DseConfiguration>((resolve, reject) => {
            
            MultiModelConfig
                .parse(mmPath, this.fmuRootPath)
                .then(multiModel => {
                    this.multiModel = multiModel;
                })
        });
    }

    save(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            try {
                fs.writeFile(this.sourcePath, JSON.stringify(this.toObject()), error => {
                    if (error)
                        reject(error);
                    else
                        resolve();
                });
            } catch (error) {
                reject(error);
            }
        });
    }


   validate(): WarningMessage[] {
        let messages: WarningMessage[] = [];

        //Check each element of DseConfiguration
        if (this.searchAlgorithm == null){
            messages.push(new WarningMessage("No valid search algorithm added"));      
        }

        return messages;
    }
}

export class DseParameter{
    // initial parameter values
    //initialValues: Map<ScalarVariable, any[]> = new Map<ScalarVariable, any[]>();
    initialValues: any[] = [];

    //FULL VERSION NEEDS KNOWLEDGE OF MULTI-MODEL IN USE
    //constructor(public fmu: Fmu, public name: string) {}
    constructor(public param: string) {}

    toString(){
        let paramStr : String = this.param + ": ";
        this.initialValues.forEach(function(value) {
            paramStr = paramStr + (value) + ", ";
        });
        return paramStr;
    }

    addInitialValue(v:any){
        this.initialValues.push(v);
    }

    removeInitialValue(v:any){
        let index = this.initialValues.indexOf(v);
        this.initialValues.splice(index, 1);
    }

    setInitialValue(oldVal:any, newVal:any){
        let index = this.initialValues.indexOf(oldVal);
        this.initialValues.splice(index, 1, newVal);
    }
}

export class DseObjectiveConstraint{
    constraint:string = ""
    
    constructor(c:string){
        this.constraint = c;
    }

    toString(){
        return this.constraint;
    }

    toObject() {
        return  this.constraint;
    }
}


export class DseParameterConstraint{
    constraint:string = ""
     
    constructor(c:string){
        this.constraint = c;
    }

    toString(){
        return this.constraint;
    }

    toObject() {
        return this.constraint;
    }
}


export interface IDseObjective{
    toFormGroup(): FormGroup;
    toObject(): { [key: string]: any };
    type: string;
    name: string;
}

export class ExternalScript implements IDseObjective{
    type = "External Script";
    name = "";
    fileName = "";
    parameterList : ObjectiveParam [];

    constructor(n:string, file:string, params : ObjectiveParam []){
        this.name = n;
        this.fileName = file;
        this.parameterList = params;
    }

    toFormGroup() {
        return new FormGroup({});
    }

    addParameter(v:string){
        let newId = this.parameterList.length+1;
        let newObj = new ObjectiveParam(newId.toString(), v);
        this.parameterList.push(newObj);
    }

    removeParameter(v:any){
        let index = this.parameterList.indexOf(v);
        this.parameterList.splice(index, 1);
    }

    setParameterId(p:ObjectiveParam, newid:any){
        let index = this.parameterList.indexOf(p);
        let newObj = this.parameterList[index];
        newObj.setId(newid);
        this.parameterList.splice(index, 1, newObj);
    }

    setParameterValue(p:ObjectiveParam, newVal:any){
        let index = this.parameterList.indexOf(p);
        let newObj = this.parameterList[index];
        newObj.setValue(newVal);
        this.parameterList.splice(index, 1, newObj);
    }


    toObject() {
        let params : any = {};
        this.parameterList.forEach((p:ObjectiveParam) =>{
            params[p.id] = p.value
        });

        return {
            scriptFile : this.fileName,
            scriptParameters: params,
        };
    }

    toString(){
        let extScriptStr : String = this.name + ": (";
        this.parameterList.forEach(function(p) {
            extScriptStr = extScriptStr + (p.toString()) + ", ";
        });
        extScriptStr = extScriptStr + ")";
        return extScriptStr;
    }



};


export class InternalFunction implements IDseObjective{
    type = "Internal Function";
    name = "";
    funcType = "";
    columnId = ""

    constructor(n:string, fType:string, cId : ""){
        this.name = n;
        this.funcType = fType;
        this.columnId = cId;
    }

    toFormGroup() {
        return new FormGroup({});
    }

    toObject() {
        return {
            objectiveType : this.funcType,
            columnID: this.columnId,
        };
    }

    toString(){
        let intFuncStr : String = this.name + ": " + this.columnId;
        return intFuncStr;
    }
};

export class ObjectiveParam{
    id: string;
    value : string;

    constructor(i : string, v : string){
        this.id = i;
        this.value = v;
    }

    setId(newId :string){
        this.id = newId
    }

    setValue(newvalue :string){
        this.value = newvalue
    }

    toString(){
        return ("" + this.value);
    }
    toObject(){
        return {
            id: this.value,
        };
    }
}

export interface IDseRanking {
    toFormGroup(): FormGroup;
    toObject(): { [key: string]: any };
    type: string;
    getType():string;
}

export class ParetoRanking implements IDseRanking {
    type = "Pareto";
    dimensions : ParetoDimension [] ;

    constructor(dim : ParetoDimension []){
        this.dimensions = dim;
    }

    toFormGroup() {
        return new FormGroup({});
    }

    toObject() {
        let dim:any = {};

        this.dimensions.forEach((d:ParetoDimension)=> {
            dim[d.objectiveName] = d.direction;
        });

        return {
            pareto: dim,
        };
    }

    getType(){
        return this.type;
    }

    addDimension(objective:string, direction:any){
        if (this.dimensions.length < 2){
            let newDimension = new ParetoDimension(objective, direction);
            this.dimensions.push(newDimension);
        }
    }

    removeDimension(d:ParetoDimension){
        let index = this.dimensions.indexOf(d);
        this.dimensions.splice(index, 1);
    }

    getDimensions(){
        return this.dimensions;
    }

    getDimensionsAsString(){
        let dimensionStr : String = "";
        this.dimensions.forEach((d:ParetoDimension) =>{
            dimensionStr = dimensionStr + (d.objectiveName + ' = ' + d.direction) + ", ";
        });
        return dimensionStr;
    }
}

export class ParetoDimension{
    objectiveName : string;
    direction : string

    constructor(n: string, d: string) {
        this.objectiveName = n;
        this.direction = d;
    }

    getObjectiveName(){
        return this.objectiveName
    }

    getDirection(){
        return this.direction
    }
}

export interface IDseAlgorithm {
    toFormGroup(): FormGroup;
    getName():string;
    toObject(): { [key: string]: any };
    type: string;
    name: string;
}


export class GeneticSearch implements IDseAlgorithm {
    type = "genetic";
    name = "Genetic";

    constructor(
        public initialPopulation: number = 0,
        public randomBalanced: string = "random",
        public terminationRounds: number = 0) {
    }

    getName(){
        return this.name;
    }

    toFormGroup() {
        return new FormGroup({
            initialPopulation: new FormControl(this.initialPopulation, [Validators.required, numberValidator]),
            randomBalanced: new FormControl(this.randomBalanced, [Validators.required]),
            terminationRounds: new FormControl(this.terminationRounds, [Validators.required, numberValidator])
        });
    }

    toObject() {
        return {
            type: this.type,
            initialPopulation: Number(this.initialPopulation),
            randomBalanced: String(this.randomBalanced),
            terminationRounds: Number(this.terminationRounds)
        };
    }
}

export class ExhaustiveSearch implements IDseAlgorithm {
    type = "exhaustive";
    name = "Exhaustive";

    constructor() {
    }

    getName(){
        return this.name;
    }

    toFormGroup() {
        return new FormGroup({});
    }

    toObject() {
        return {
            type: this.type,
        };
    }
}


export class DseScenario {
    name:string = ""
    
    constructor(c:string){
        this.name = c;
    }

    toString(){
        return this.name;
    }

    toObject() {
        return  this.name;
    }
}
