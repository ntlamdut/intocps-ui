import { Component, Input, NgZone, Output, EventEmitter } from "@angular/core";
import {Serializer} from "../../intocps-configurations/Parser";
import {OutputConnectionsPair} from "../coe/models/Fmu";
import IntoCpsApp from "../../IntoCpsApp";
import {DseConfiguration,DseParameter, DseScenario, DseParameterConstraint, DseObjectiveConstraint,IDseAlgorithm, GeneticSearch, ExhaustiveSearch} from "../../intocps-configurations/dse-configuration";
import { WarningMessage } from "../../intocps-configurations/Messages";
import { NavigationService } from "../shared/navigation.service";
import { FormGroup, REACTIVE_FORM_DIRECTIVES, FORM_DIRECTIVES, FormArray, FormControl, Validators } from "@angular/forms";

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

        if (path)
            this.parseConfig();
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
    warnings: WarningMessage[] = [];
    parseError: string = null;
    
    config : DseConfiguration;

    private algorithmConstructors = [
        ExhaustiveSearch,
        GeneticSearch
    ];
    constructor(private zone: NgZone, private navigationService: NavigationService) {
        this.navigationService.registerComponent(this);
    }

    parseConfig() {
       let project = IntoCpsApp.getInstance().getActiveProject();
       
       DseConfiguration
           .parse(this.path)
           .then(config => {
                this.zone.run(() => {
                    //this.parseError = null;

                    this.config = config;
                    

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
                  //    params : new FormArray(this.config.dseParameters.map(c => new FormControl(c))),
                        paramConstraints : new FormArray(this.config.paramConst.map(c => new FormControl(c))),
                        objConstraints : new FormArray(this.config.objConst.map(c => new FormControl(c))),
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


    getSearchAlgorithm(){
        return this.config.searchAlgorithm.getName()
    }


    addParameter(){
        let p = this.config.addParameter();
       // let pArray = <FormArray>this.form.find('params');
        
      //  pArray.push(new FormControl(this.getParameterName(p)));
    }

    setParameterName(p: DseParameter, name: string) {
        p.param = `${name}`;
    }

    getParameterName(p:DseParameter){
        return p.param;
    }

    removeParameter(p:DseParameter){
        this.config.removeParameter(p);
       /// let pArray = <FormArray>this.form.find('params');
       // let index = this.config.dseParameters.indexOf(p);
        
      //  pArray.removeAt(index);
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
        //To add
    }
    addinternalFunction(){
        //To add
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