import { FORM_DIRECTIVES, REACTIVE_FORM_DIRECTIVES, Validators, FormArray, FormControl, FormGroup } from "@angular/forms";
import { numberValidator } from "../angular2-app/shared/validators";
import * as fs from "fs"
import { DseParser } from "./dse-parser"
import { Fmu, ScalarVariableType, ScalarVariable} from "../angular2-app/coe/models/Fmu";
import {WarningMessage, ErrorMessage} from "./Messages";

export class DseConfiguration implements ISerializable {
    sourcePath: string;
    searchAlgorithm: IDseAlgorithm = new ExhaustiveSearch(); //set as default
    scenarios: DseScenario[] = [];
    objConst : DseObjectiveConstraint []= [];
    paramConst : DseParameterConstraint []= [];
    dseParameters : DseParameter[] =[];
    dseObjectives : IDseObjective[] = [];
    ranking : IDseRanking = new ParetoRanking(new Map());

    toObject() {
        return {
            algorithm: this.searchAlgorithm.toObject(),
            objectiveConstraints: this.objConst,
          //  objectiveDefinitions: this.dseObjectives.toObject(),
            parameterConstraints: this.paramConst,
          //  parameters: this.dseParameters.toObject(),
            ranking: this.ranking.toObject(),
            scenarios: this.scenarios
        }
    }


    public newSearchAlgortihm(sa:IDseAlgorithm){
        this.searchAlgorithm = sa;
    }

    public newObjectiveConstraint(oc: DseObjectiveConstraint[]){
        this.objConst = oc;
    }

    getObjective(obName : string) {
        return this.dseObjectives.find(v => v.name == obName) || null;
    }

    public addParameterConstraint(): DseParameterConstraint{
        let newPC = new DseParameterConstraint("");
        this.paramConst.push(newPC);
        return newPC;
    }

    public newParameterConstraint(pc:DseParameterConstraint[]){
        this.paramConst = pc;
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

    public newExternalScript(n:string, params : ObjectiveParam []){
         this.dseObjectives.push(new ExternalScript(n, params));
    }

    public newRanking(r: IDseRanking){
        this.ranking = r;
    }

    public newScenario(scen:DseScenario []){
         this.scenarios = scen;
    }

    static parse(path: string): Promise<DseConfiguration> {
        return new Promise<DseConfiguration>((resolve, reject) => {
            fs.access(path, fs.constants.R_OK, error => {
                if (error) return reject(error);
                fs.readFile(path, (error, content) => {
                    if (error) return reject(error);
                    this.create(path, JSON.parse(content.toString()))
                        .then(dseConfig => resolve(dseConfig))
                        .catch(error => reject(error));
                });
            });
        });
    }

    static create(path:string, data: any): Promise<DseConfiguration> {
        return new Promise<DseConfiguration>((resolve, reject) => {
            let parser = new DseParser();
            let configuration = new DseConfiguration();
            configuration.sourcePath = path;

            parser.parseSearchAlgorithm(data, configuration);
            parser.parseScenarios(data, configuration);
            parser.parseObjectiveConstraint(data, configuration);
            parser.parseParameterConstraints(data, configuration);
            parser.parseParameters(data, configuration);
            parser.parseObjectives(data, configuration);
            parser.parseRanking(data,configuration);
            resolve(configuration)
        })

    }

    save(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            try {
                console.log("Saving Search Algorithm " + this.searchAlgorithm.getName());
                console.log(this);
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
        return {
            type: this.constraint,
        };
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
    parameterList : ObjectiveParam [];

    constructor(n:string, params : ObjectiveParam []){
        this.name = n;
        this.parameterList = params;
    }

    toFormGroup() {
        return new FormGroup({});
    }

    toObject() {
        return {
            type: this.type,
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

export class ObjectiveParam{
    id: string;
    value : string;

    constructor(i : string, v : string){
        this.id = i;
        this.value = v;
    }
    toString(){
        return ("" + this.value);
    }
}

export interface IDseRanking {
    toFormGroup(): FormGroup;
    toObject(): { [key: string]: any };
    type: string;
    getType():string;
}

export class ParetoRanking implements IDseRanking {
    type = "pareto ranking";
    dimensions = new Map<String, any>();

    constructor(dim : Map<String, any>) {
        this.dimensions = dim;
    }

    toFormGroup() {
        return new FormGroup({});
    }

    toObject() {
        let dim:any = {};

        this.dimensions.forEach(function(value, key) {
            dim[value] = key;
        });

        return {
            pareto: dim,
        };
    }

    getType(){
        return this.type;
    }

    getDimensionsAsMap(){
        return this.dimensions;
    }

    getDimensionsAsString(){
        let dimensionStr : String = "";
        this.dimensions.forEach(function(value, key) {
            dimensionStr = dimensionStr + (key + ' = ' + value) + ", ";
        });
        return dimensionStr;
    }

    getDimensionValue(k:string): any{
        return this.dimensions.get(k);
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
