import { Component, Input, NgZone, Output, EventEmitter } from "@angular/core";
import {Serializer} from "../../intocps-configurations/Parser";
import {
    Instance, ScalarVariable, CausalityType, InstanceScalarPair, isCausalityCompatible, isTypeCompatiple,
    Fmu, ScalarValuePair, ScalarVariableType
} from "../coe/models/Fmu";
import IntoCpsApp from "../../IntoCpsApp";
import {ParetoDimension, InternalFunction, DseConfiguration, ParetoRanking, ExternalScript, DseParameter, DseScenario, DseParameterConstraint, DseObjectiveConstraint,IDseAlgorithm, GeneticSearch, ExhaustiveSearch} from "../../intocps-configurations/dse-configuration";
import { WarningMessage } from "../../intocps-configurations/Messages";
import { NavigationService } from "../shared/navigation.service";
import { FormGroup, REACTIVE_FORM_DIRECTIVES, FORM_DIRECTIVES, FormArray, FormControl, Validators } from "@angular/forms";
import {IProject} from "../../proj/IProject";
import {Project} from "../../proj/Project";
import * as Path from 'path';
import * as fs from 'fs';

@Component({
    selector: "dse-configuration",
    templateUrl: "./angular2-app/dse/dse-configuration.component.html",
    directives: [
        FORM_DIRECTIVES,
        REACTIVE_FORM_DIRECTIVES
    ]    
})
export class DseConfigurationComponent {
    private _path:string;

    @Input()
    set path(path:string) {
        this._path = path;

        if (path){
            let app: IntoCpsApp = IntoCpsApp.getInstance();
            let p: string = app.getActiveProject().getRootFilePath();
            this.cosimConfig = this.loadCosimConfigs(Path.join(p, Project.PATH_MULTI_MODELS));

            //this.parseConfig();
        }
    }
    get path():string {
        return this._path;
    }

    @Output()
    change = new EventEmitter<string>();

    form: FormGroup;
    algorithms: IDseAlgorithm[] = [];
    algorithmFormGroups = new Map<IDseAlgorithm, FormGroup>();
    editing: boolean = false;
    editingMM: boolean = false;
    warnings: WarningMessage[] = [];
    parseError: string = null;

    mmSelected:boolean = false;
    mmPath:string = '';
    
    config : DseConfiguration;
    cosimConfig:string[] = [];
    objNames:string[] = [];
    coeconfig:string = '';

    private selectedParameterInstance: Instance;

    private newParameter: ScalarVariable;

    private algorithmConstructors = [
        ExhaustiveSearch,
        GeneticSearch
    ];

    private internalFunctionTypes = ["max", "min","mean"];

    private paretoDirections = ["-", "+"];

  
    constructor(private zone: NgZone, private navigationService: NavigationService) {
        this.navigationService.registerComponent(this);
    }

    parseConfig(mmPath : string) {
       let project = IntoCpsApp.getInstance().getActiveProject();
       
       DseConfiguration
           .parse(this.path, project.getRootFilePath(), project.getFmusPath(), mmPath)
           .then(config => {
                this.zone.run(() => {
                    this.config = config;
                    this.objNames = this.getObjectiveNames();

                    // Create an array of the algorithm from the coe config and a new instance of all other algorithms
                    this.algorithms = this.algorithmConstructors
                        .map(constructor =>
                            config.searchAlgorithm instanceof constructor
                                ? config.searchAlgorithm
                                : new constructor()
                        );
                    // Create an array of formGroups for the algorithms
                    this.algorithms.forEach(algorithm => {
                        this.algorithmFormGroups.set(algorithm, algorithm.toFormGroup());
                    });
                    
                    // Create a form group for validation
                    this.form = new FormGroup({
                        searchAlgorithm :  this.algorithmFormGroups.get(this.config.searchAlgorithm),
                        //params : new FormArray(this.config.dseParameters.map(c => new FormControl(c))),
                        paramConstraints : new FormArray(this.config.paramConst.map(c => new FormControl(c))),
                        objConstraints : new FormArray(this.config.objConst.map(c => new FormControl(c))),
                        extscr : new FormArray(this.config.extScrObjectives.map(s => new FormControl(s))),
                        scenarios : new FormArray(this.config.scenarios.map(s => new FormControl(s)))
                    });
                });
           })
            //}, error => this.zone.run(() => {this.parseError = error})).catch(error => console.error(`Error during parsing of config: ${error}`));
    }

    onNavigate(): boolean {
        if (!this.editing)
            return true;

        if (this.form.valid) {
            if (confirm("Save your work before leaving?"))
                this.onSubmit();

            return true;
        } else {
            return confirm("The changes to the configuration are invalid and can not be saved. Continue anyway?");
        }
    }

    onAlgorithmChange(algorithm: IDseAlgorithm) {
        this.config.searchAlgorithm = algorithm;

        this.form.removeControl('algorithm');
        this.form.addControl('algorithm', this.algorithmFormGroups.get(algorithm));
    }

    onSubmit() {
        if (!this.editing) return;

        this.warnings = this.config.validate();

        let override = false;

        if (this.warnings.length > 0) {

            let remote = require("electron").remote;
            let dialog = remote.dialog;
            let res = dialog.showMessageBox({ title: 'Validation failed', message: 'Do you want to save anyway?', buttons: ["No", "Yes"] });

            if (res == 0) {
                return;
            } else {
                override = true;
                this.warnings = [];
            }
        }

        this.config.save()
                .then(() => this.change.emit(this.path));
       
        this.editing = false;
    }
    
    onMMSubmit() {
        if (!this.editingMM) return;
        this.editingMM = false;
        if (this.mmPath !='')
        {
            this.mmSelected = true;
        }
    }
    

    getFiles(path: string): string [] {
        var fileList: string[] = [];
        var files = fs.readdirSync(path);
        for(var i in files){
            var name = Path.join(path, files[i]);
            if (fs.statSync(name).isDirectory()){
                fileList = fileList.concat(this.getFiles(name));
            } else {
                fileList.push(name);
            }
        }
    
        return fileList;
    }

    loadCosimConfigs(path: string): string[] {
        var files: string[] = this.getFiles(path);
        return  files.filter(f => f.endsWith(".coe.json"));
    }

    experimentName(path: string): string {
        let elems = path.split(Path.sep);
        let mm: string = elems[elems.length-2];
        let ex: string = elems[elems.length-3];
        return mm + " | " + ex;
    }

    getMultiModelName():string{
        return this.experimentName(this.mmPath);
    }

    onConfigChange(config:string) {
        this.coeconfig = config;
        let mmPath = Path.join(this.coeconfig, "..", "..", "mm.json");

        if (!fs.existsSync(mmPath)) {
            console.warn("Could not find mm at: " + mmPath + " initiating search or possible alternatives...")
            //no we have the old style
            fs.readdirSync(Path.join(this.coeconfig, "..", "..")).forEach(file => {
                if (file.endsWith("mm.json")) {
                    mmPath = Path.join(this.coeconfig, "..", "..", file);
                    console.debug("Found old style mm at: " + mmPath);
                    return;
                }
            });
        }
        this.mmPath=mmPath;
        this.parseConfig(mmPath);
    }

    getSearchAlgorithm(){
        return this.config.searchAlgorithm.getName()
    }


    /* REUSED FROM MM-CONFIG */
    selectParameterInstance(instance: Instance) {
        this.selectedParameterInstance = instance;
        this.newParameter = this.getParameters()[0];
    }

    getParameters() {
        if (!this.selectedParameterInstance)
            return [null];

        return this.selectedParameterInstance.fmu.scalarVariables
            .filter(variable => isCausalityCompatible(variable.causality, CausalityType.Parameter) && !this.selectedParameterInstance.initialValues.has(variable));
    }

    getInitialValues(): Array<ScalarValuePair> {
        let initialValues: Array<ScalarValuePair> = [];

        this.selectedParameterInstance.initialValues.forEach((value, variable) => {
            initialValues.push(new ScalarValuePair(variable, value));
        });

        return initialValues;
    }

    getScalarTypeName(type: number) {
        return ['Real', 'Bool', 'Int', 'String', 'Unknown'][type];
    }

    addParameter() {
        if (!this.newParameter) return;

        this.selectedParameterInstance.initialValues.set(this.newParameter, []);
        this.newParameter = this.getParameters()[0];
      }

    removeParameter(instance: Instance, parameter: ScalarVariable) {
        instance.initialValues.delete(parameter);
        this.newParameter = this.getParameters()[0];
    }


    setParameterName(p: DseParameter, name: string) {
        p.param = `${name}`;
    }

    getParameterName(p:DseParameter){
        return p.param;
    }

    setDSEParameter(instance: Instance, variableName:string, newValue: any) {
        if (!newValue.includes(",")){
            if (instance.fmu.getScalarVariable(variableName).type === ScalarVariableType.Real)
                newValue = parseFloat(newValue);
            else if (instance.fmu.getScalarVariable(variableName).type === ScalarVariableType.Int)
                newValue = parseInt(newValue);
            else if (instance.fmu.getScalarVariable(variableName).type === ScalarVariableType.Bool)
                newValue = !!newValue;
        }
        else{
            newValue = this.parseArray(instance.fmu.getScalarVariable(variableName).type, newValue);
        }

        let varExistsInDSE = false
        let instanceExistsInDSE = false

        for (let dseParam of this.config.dseSearchParameters) {
            if (dseParam.name === instance.name) {
                instanceExistsInDSE = true
                dseParam.initialValues.forEach((value, variable) => {
                    if (variable.name === variableName){
                          dseParam.initialValues.set(variable, newValue)
                          varExistsInDSE = true
                    }
                })
            }
        }
        if(!instanceExistsInDSE){
            let newInstance = this.addDSEParameter(instance);            
            newInstance.initialValues.set(instance.fmu.getScalarVariable(variableName), newValue);
        }
        if(!varExistsInDSE){
            for (let dseParam of this.config.dseSearchParameters) {
                if (dseParam.name === instance.name) {
                    dseParam.initialValues.set(instance.fmu.getScalarVariable(variableName), newValue);
                }
            }        
        }
    }

    addDSEParameter(instance: Instance):Instance{
        let newInstance = instance
        this.config.dseSearchParameters.push(newInstance);            
        return newInstance;
    }
    
    removeDSEParameter(instance: Instance, variableName:string) {
        for (let dseParam of this.config.dseSearchParameters) {
            if (dseParam.name === instance.name) {
                dseParam.initialValues.delete(instance.fmu.getScalarVariable(variableName));
            }
        }
    }

    parseArray(tp : ScalarVariableType, value: any):any []{
        let newArray = value.split(",")
        for(let v of newArray){
            if (tp === ScalarVariableType.Real)
                newArray.splice(newArray.indexOf(v),1, parseFloat(v));
            else if (tp === ScalarVariableType.Int)
                newArray.splice(newArray.indexOf(v),1, parseInt(v));
            else if (tp === ScalarVariableType.Bool)
                newArray.splice(newArray.indexOf(v),1, !!v);
        }
        return newArray
    }

    //Utility method to obtain an instance from the multimodel by its string id encoding
    private getParameter(dse: DseConfiguration, id: string): Instance {
        let ids = this.parseId(id);

        let fmuName = ids[0];
        let instanceName = ids[1];
        let scalarVariableName = ids[2];
        return dse.getInstanceOrCreate(fmuName, instanceName);
    }

    parseId(id: string): string[] {
        //is must have the form: '{' + fmuName '}' + '.' instance-name + '.' + scalar-variable
        // restriction is that instance-name cannot have '.'

        let indexEndCurlyBracket = id.indexOf('}');
        if (indexEndCurlyBracket <= 0) {
            throw "Invalid id";
        }

        let fmuName = id.substring(0, indexEndCurlyBracket + 1);
        var rest = id.substring(indexEndCurlyBracket + 1);
        var dotIndex = rest.indexOf('.');
        if (dotIndex < 0) {
            throw "Missing dot after fmu name";
        }
        rest = rest.substring(dotIndex + 1);
        //this is instance-name start index 0

        dotIndex = rest.indexOf('.');
        if (dotIndex < 0) {
            throw "Missing dot after instance name";
        }
        let instanceName = rest.substring(0, dotIndex);
        let scalarVariableName = rest.substring(dotIndex + 1);

        return [fmuName, instanceName, scalarVariableName];
    }

    dseParamExists(instance: Instance, variableName:string) :boolean{    
        let paramFound = false;
        
        for (let dseParam of this.config.dseSearchParameters) {
            if (dseParam.name === instance.name) {
                dseParam.initialValues.forEach((value, variable) => {
                    if (variable.name === variableName){
                        paramFound = true;
                    }
                })
            }
        }
        return paramFound;
    }


    getDseParamValue(instance: Instance, variableName:string) :any{    
        let result = "ERROR";
        for (let dseParam of this.config.dseSearchParameters) {
            if (dseParam.name === instance.name) {
                dseParam.initialValues.forEach((value, variable) => {
                    if (variable.name === variableName){
                        result = value;
                    }
                })
            }
        }
        return result;
    }


    addParameterInitialValue(p: DseParameter, value: any) {
        p.addInitialValue(value);
    }

    getParameterIntialValues(p:DseParameter){
        return p.initialValues;
    }

    setParameterIntialValues(p:DseParameter, oldVal: any, newVal:any){
        return p.setInitialValue(oldVal, newVal);
    }

    removeParameterInitialValue(p: DseParameter, value: string) {
        p.removeInitialValue(value);
    }



    addParameterConstraint(){
        let pc = this.config.addParameterConstraint();
        let pcArray = <FormArray>this.form.find('paramConstraints');
        
        pcArray.push(new FormControl(this.getParameterConstraint(pc)));
    }

    setParameterConstraint(pc: DseParameterConstraint, name: string) {
        pc.constraint = `${name}`;
    }

    getParameterConstraint(pc:DseParameterConstraint){
        return pc.constraint;
    }

    removeParameterConstraint(pc:DseParameterConstraint){
        this.config.removeParameterConstraint(pc);
        let pcArray = <FormArray>this.form.find('paramConstraints');
        let index = this.config.paramConst.indexOf(pc);
        
        pcArray.removeAt(index);
    }



    addExternalScript(){
        let es = this.config.addExternalScript();
    }

    getExternalScriptName(e: ExternalScript){
        return e.name;
    }

    setExternalScriptName(p: ExternalScript, name: string) {
        p.name = `${name}`;
    }

    getExternalScriptFilename(e: ExternalScript){
        return e.fileName;
    }

    setExternalScriptFileName(p: ExternalScript, name: string) {
        p.fileName = `${name}`;
    }

    getExternalScriptParameters(e: ExternalScript){
        return e.parameterList;
    }

    addExternalScriptParameter(e: ExternalScript, value: any) {
        e.addParameter(value);
    }

    setExternalScriptParameterId(e:ExternalScript, param: any, newId:any){
        return e.setParameterId(param, newId);
    }

    setExternalScriptParameterValue(e:ExternalScript, param: any, newVal:any){
        return e.setParameterValue(param, newVal);
    }
    removeExternalScriptParameter(e: ExternalScript, value: string) {
        e.removeParameter(value);
    }

    removeExternalScript(e:ExternalScript){
        this.config.removeExternalScript(e);
    }



    addInternalFunction(){
        let intf = this.config.addInternalFunction();
    }

    removeInternalFunction(i:InternalFunction){
        this.config.removeInternalFunction(i);
    }

    getInternalFunctionName(i: InternalFunction){
        return i.name;
    }

    setInternalFunctionName(i: InternalFunction, name: string) {
        i.name = `${name}`;
    }

    getInternalFunctionColumnName(i: InternalFunction){
        return i.columnId;
    }

    setInternalFunctionColumnName(i: InternalFunction, name: string) {
        i.columnId = `${name}`;
    }

    getInternalFunctionObjectiveType(i: InternalFunction){
        return i.funcType;
    }

    setInternalFunctionObjectiveType(i: InternalFunction, name: string) {
        i.funcType = `${name}`;
    }



    addObjectiveConstraint(){
        let oc = this.config.addObjectiveConstraint();
        let ocArray = <FormArray>this.form.find('objConstraints');
        
        ocArray.push(new FormControl(this.getObjectiveConstraint(oc)));
    }

    setObjectiveConstraint(oc: DseObjectiveConstraint, name: string) {
        oc.constraint = `${name}`;
    }

    getObjectiveConstraint(oc:DseObjectiveConstraint){
        return oc.constraint;
    }

    removeObjectiveConstraint(oc:DseObjectiveConstraint){
        this.config.removeObjectiveConstraint(oc);
        let ocArray = <FormArray>this.form.find('objConstraints');
        let index = this.config.objConst.indexOf(oc);
        
        ocArray.removeAt(index);
    }



    getRankingMethod(){
        return this.config.ranking.getType();
    }

    getObjectiveNames():string []{
        let objNames = [""];
        this.config.extScrObjectives.forEach((o:ExternalScript) =>{
            objNames.push(o.name)
        });
        this.config.intFunctObjectives.forEach((o:InternalFunction) =>{
            objNames.push(o.name)
        });
        
        return objNames;
    }

    getRankingDimensions(){
        return (<ParetoRanking> this.config.ranking).getDimensions();
    }

    getDimensionName(d:ParetoDimension){
        return d.getObjectiveName()
    }

    setDimensionName(d:ParetoDimension, name: string){
        d.objectiveName = name;
    }

    onDimensionChange(pd: ParetoDimension, d:string){
        pd.objectiveName = d;
    }

    getDimensionDirection(d:ParetoDimension){
        return d.getDirection()
    }

    setDimensionDirection(d :ParetoDimension, direct :string){
        d.direction = direct;
    }

    removeParetoDimension(d:ParetoDimension){
        (<ParetoRanking> this.config.ranking).removeDimension(d);
    }

    addParetoDimension(objective:string, direction:string){
        if (this.config.ranking instanceof ParetoRanking){
            (<ParetoRanking> this.config.ranking).addDimension(objective, direction);
        }
    }


    addScenario(){
        let s = this.config.addScenario();
        let sArray = <FormArray>this.form.find('scenarios');
        
        sArray.push(new FormControl(this.getScenario(s)));
    }

    setScenario(s: DseScenario, name: string) {
        s.name = `${name}`;
    }

    getScenario(s:DseScenario){
        return s.name;
    }

    removeScenario(s:DseScenario){
        this.config.removeScenario(s);
        let sArray = <FormArray>this.form.find('scenarios');
        let index = this.config.scenarios.indexOf(s);
        
        sArray.removeAt(index);
    }

}