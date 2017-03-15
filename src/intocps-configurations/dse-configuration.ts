import { FORM_DIRECTIVES, REACTIVE_FORM_DIRECTIVES, Validators, FormArray, FormControl, FormGroup } from "@angular/forms";
import { numberValidator } from "../angular2-app/shared/validators";
import * as fs from "fs"
import { DseParser } from "./dse-parser"
import { Fmu, ScalarVariableType, ScalarVariable} from "../angular2-app/coe/models/Fmu";

export class DseConfiguration implements ISerializable {
    sourcePath: string;
    searchAlgorithm: IDseAlgorithm;
    scenarios: string[] = [];
    objConst : string;
    paramConst : string;
    dseParameters : DseParameter[] =[];
    dseObjectives : IDseObjective[] = [];
    ranking : IDseRanking;

    toObject() {
        return {
            searchAlgorithm: this.searchAlgorithm
        }
    }

    getObjective(obName : string) {
        return this.dseObjectives.find(v => v.name == obName) || null;
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
            configuration.searchAlgorithm = parser.parseSearchAlgorithm(data);
            configuration.sourcePath = path;
            configuration.scenarios= parser.parseScenarios(data);
            configuration.objConst= parser.parseObjectiveConstraint(data);
            configuration.paramConst= parser.parseParameterConstraints(data);
            parser.parseParameters(data, configuration);
            parser.parseObjectives(data, configuration);
            configuration.ranking = parser.parseRanking(data);
            resolve(configuration)
        })

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
        return {
            type: this.type,
        };
    }

    getDimensions(){
        let dimensionStr : String = "";
        this.dimensions.forEach(function(value, key) {
            dimensionStr = dimensionStr + (key + ' = ' + value) + ", ";
        });
        return dimensionStr;
    }
}

export interface IDseAlgorithm {
    toFormGroup(): FormGroup;
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
        public terminationRounds: number = 0
    ) {

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

    toFormGroup() {
        return new FormGroup({});
    }

    toObject() {
        return {
            type: this.type,
        };
    }
}
