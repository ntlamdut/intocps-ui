import { Component, Input, EventEmitter, Output, NgZone } from "@angular/core";
import { FORM_DIRECTIVES, REACTIVE_FORM_DIRECTIVES, Validators, FormArray, FormControl, FormGroup } from "@angular/forms";
import IntoCpsApp from "../../IntoCpsApp";
import {
    CoSimulationConfig, ICoSimAlgorithm, FixedStepAlgorithm,
    VariableStepAlgorithm, ZeroCrossingConstraint, BoundedDifferenceConstraint, SamplingRateConstraint,
    VariableStepConstraint
} from "../../intocps-configurations/CoSimulationConfig";
import { ScalarVariable, CausalityType, Instance, InstanceScalarPair } from "./models/Fmu";
import { ZeroCrossingComponent } from "./inputs/zero-crossing.component";
import { BoundedDifferenceComponent } from "./inputs/bounded-difference.component";
import { SamplingRateComponent } from "./inputs/sampling-rate.component";
import { numberValidator, lessThanValidator } from "../shared/validators";
import { NavigationService } from "../shared/navigation.service";
import { WarningMessage } from "../../intocps-configurations/Messages";
import { FileBrowserComponent } from "../mm/inputs/file-browser.component";

@Component({
    selector: "coe-configuration",
    directives: [
        FORM_DIRECTIVES,
        REACTIVE_FORM_DIRECTIVES,
        ZeroCrossingComponent,
        BoundedDifferenceComponent,
        SamplingRateComponent,
        FileBrowserComponent
    ],
    templateUrl: "./angular2-app/coe/coe-configuration.component.html"
})
export class CoeConfigurationComponent {
    private _path: string;
    private searchName: string = '';

    @Input()
    set path(path: string) {
        this._path = path;

        if (path)
            this.parseConfig();
    }
    get path(): string {
        return this._path;
    }

    @Output()
    change = new EventEmitter<string>();

    form: FormGroup;
    algorithms: ICoSimAlgorithm[] = [];
    algorithmFormGroups = new Map<ICoSimAlgorithm, FormGroup>();
    outputPorts: Array<InstanceScalarPair> = [];
    newConstraint: new (...args: any[]) => VariableStepConstraint;
    editing: boolean = false;
    parseError: string = null;
    warnings: WarningMessage[] = [];
    loglevels: string[] = ["Not set", "ERROR", "WARN", "INFO", "DEBUG", "TRACE"];

    private config: CoSimulationConfig;

    private algorithmConstructors = [
        FixedStepAlgorithm,
        VariableStepAlgorithm
    ];

    private constraintConstructors = [
        ZeroCrossingConstraint,
        BoundedDifferenceConstraint,
        SamplingRateConstraint
    ];

    constructor(private zone: NgZone, private navigationService: NavigationService) {
        this.navigationService.registerComponent(this);
    }

    private parseConfig() {
        let project = IntoCpsApp.getInstance().getActiveProject();

        CoSimulationConfig
            .parse(this.path, project.getRootFilePath(), project.getFmusPath())
            .then(config => {
                this.zone.run(() => {
                    this.config = config;

                    this.parseError = null;

                    // Create an array of the algorithm from the coe config and a new instance of all other algorithms
                    this.algorithms = this.algorithmConstructors
                        .map(constructor =>
                            config.algorithm instanceof constructor
                                ? config.algorithm
                                : new constructor()
                        );
                    // Create an array of formGroups for the algorithms
                    this.algorithms.forEach(algorithm => {
                        this.algorithmFormGroups.set(algorithm, algorithm.toFormGroup());
                    });
                    // Create an array of all output ports on all instances
                    this.outputPorts = this.config.multiModel.fmuInstances
                        .map(instance => instance.fmu.scalarVariables
                            .filter(sv => sv.causality === CausalityType.Output)
                            .map(sv => this.config.multiModel.getInstanceScalarPair(instance.fmu.name, instance.name, sv.name)))
                        .reduce((a, b) => a.concat(...b),[]);

                    // Create a form group for validation
                    this.form = new FormGroup({
                        startTime: new FormControl(config.startTime, [Validators.required, numberValidator]),
                        endTime: new FormControl(config.endTime, [Validators.required, numberValidator]),
                        livestreamInterval: new FormControl(config.livestreamInterval, [Validators.required, numberValidator]),
                        algorithm: this.algorithmFormGroups.get(this.config.algorithm),
                        global_absolute_tolerance: new FormControl(config.global_absolute_tolerance, [Validators.required, numberValidator]),
                        global_relative_tolerance: new FormControl(config.global_relative_tolerance, [Validators.required, numberValidator])
                    }, null, lessThanValidator('startTime', 'endTime'));
                });
            }, error => this.zone.run(() => {this.parseError = error})).catch(error => console.error(`Error during parsing of config: ${error}`));
    }

    public setPostProcessingScript(config: CoSimulationConfig, path: string) {
        config.postProcessingScript = config.getProjectRelativePath(path);
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

    onAlgorithmChange(algorithm: ICoSimAlgorithm) {
        this.config.algorithm = algorithm;

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

        if (override) {
            this.config.saveOverride()
                .then(() => this.change.emit(this.path));
        } else {
            this.config.save()
                .then(() => this.change.emit(this.path));
        }



        this.editing = false;
    }

    getOutputs(scalarVariables: Array<ScalarVariable>) {
        return scalarVariables.filter(variable => (variable.causality === CausalityType.Output || variable.causality === CausalityType.Local));
    }

    restrictToCheckedLiveStream(instance: Instance, scalarVariables: Array<ScalarVariable>){
        return scalarVariables.filter(variable => this.isLivestreamChecked(instance,variable));
    }

    addConstraint() {
        if (!this.newConstraint) return;

        let algorithm = <VariableStepAlgorithm>this.config.algorithm;
        let formArray = <FormArray>this.form.find('algorithm').find('constraints');

        let constraint = new this.newConstraint();

        algorithm.constraints.push(constraint);
        formArray.push(constraint.toFormGroup());
    }

    removeConstraint(constraint: VariableStepConstraint) {
        let algorithm = <VariableStepAlgorithm>this.config.algorithm;
        let formArray = <FormArray>this.form.find('algorithm').find('constraints');
        let index = algorithm.constraints.indexOf(constraint);

        algorithm.constraints.splice(index, 1);
        formArray.removeAt(index);
    }

    getConstraintName(constraint: any) {
        if (constraint === ZeroCrossingConstraint || constraint instanceof ZeroCrossingConstraint)
            return "Zero Crossing";

        if (constraint === BoundedDifferenceConstraint || constraint instanceof BoundedDifferenceConstraint)
            return "Bounded Difference";

        if (constraint === SamplingRateConstraint || constraint instanceof SamplingRateConstraint)
            return "Sampling Rate";
    }

    isLivestreamChecked(instance: Instance, output: ScalarVariable) {
        let variables = this.config.livestream.get(instance);

        if (!variables) return false;

        return variables.indexOf(output) !== -1;
    }

    isLocal(variable: ScalarVariable):boolean
    {
        return variable.causality === CausalityType.Local
    }

    onLivestreamChange(enabled: boolean, instance: Instance, output: ScalarVariable) {
        let variables = this.config.livestream.get(instance);

        if (!variables) {
            variables = [];
            this.config.livestream.set(instance, variables);
        }

        if (enabled)
            variables.push(output);
        else {
            variables.splice(variables.indexOf(output), 1);

            if (variables.length == 0)
                this.config.livestream.delete(instance);
        }
    }

    private func = function(id : any){
        console.log("func"); console.log(document.getElementById(id).style.display)
        if(document.getElementById(id).style.display=="none"){
            document.getElementById(id).style.display="initial";
        }else{
            document.getElementById(id).style.display="none";
        }
    }

    search(name : string){
        //console.log(name.length);

        //console.log(document.getElementsByClassName("col-sm-5 col-md-4 control-label config").length);

        var myNode = document.getElementById("result-research");

        while (myNode.firstChild) {
                myNode.removeChild(myNode.firstChild);
        }

        /*for(let k =0; k < document.getElementsByClassName("col-sm-5 col-md-4 control-label config").length-1; k++){
            
            document.getElementsByClassName("col-sm-5 col-md-4 control-label config")[0].remove();
        }*/

        for(let instance of this.config.multiModel.fmuInstances){

            if(document.getElementById("toremove")){ document.getElementById("toremove").remove();}
            
            var inst = document.createElement("div");
            console.log("new instance");
            inst.className = "form-group";

            var label = document.createElement("div")
            label.innerHTML = instance.fmu.name + "." + instance.name;
            label.style.fontWeight = "bold";
            label.className = "col-sm-5 col-md-4 control-label";
            
            
            /*inst.style.display = "flex";
            inst.style.flexDirection = "column";*/

           
            var div = document.createElement("div");
            div.className = "col-sm-7 col-md-8";
            


            for(let output of this.getOutputs(instance.fmu.scalarVariables)){
                if(output.name.includes(name)){
                    console.log(output.name);
                    var answer = document.createElement('input');
                    answer.setAttribute('type', 'checkbox');
                    answer.disabled = !this.editing;
                    answer.checked = this.isLivestreamChecked(instance, output);
                    answer.onchange = function() {
                        if(answer.checked) {
                            // Checkbox is checked.
                            console.log(answer.innerText + " checked")
                            this.onLivestreamChange(true, instance, output);
                        } else {
                            // Checkbox is not checked.
                            console.log(answer.innerText + " unchecked")
                            this.onLivestreamChange(false, instance, output);
                        }
                    }.bind(this);

                    var lab = document.createElement("label");
                    lab.appendChild(answer);
                    lab.appendChild(document.createTextNode(output.name));

                    var check = document.createElement("div");
                    check.className = "checkbox";

                    check.appendChild(lab);

                    
                    div.appendChild(check);
                    
                }  
            
            }

            inst.appendChild(label);
            inst.appendChild(div);
            document.getElementById("result-research").appendChild(inst);
            /*document.getElementById("result-research").style.display = "flex";
            document.getElementById("result-research").style.flexDirection = "column";*/
        }
    }
}