import {Component, Input, OnInit, NgZone} from "@angular/core";
import {MultiModelConfig} from "../../intocps-configurations/MultiModelConfig";
import IntoCpsApp from "../../IntoCpsApp";
import {Instance, ScalarVariable, CausalityType, InstanceScalarPair, isCausalityCompatible, isTypeCompatiple} from "../coe/models/Fmu";

@Component({
    selector: "mm-configuration",
    templateUrl: "./angular2-app/mm/mm-configuration.component.html"
})
export class MmConfigurationComponent extends OnInit {
    @Input()
    path:string;

    private config:MultiModelConfig;

    private selectedOutputInstance:Instance;
    private selectedOutput:ScalarVariable;
    private selectedInputInstance:Instance;

    constructor(private zone:NgZone) {

    }

    ngOnInit() {
        let project = IntoCpsApp.getInstance().getActiveProject();

        MultiModelConfig
            .parse(this.path, project.getFmusPath())
            .then(config => this.zone.run(() => this.config = config));
    }

    onSubmit() {
        this.config.save();
    }

    addFmu() {
        throw "not implemented";
    }

    selectOutputInstance(instance:Instance) {
        this.selectedOutputInstance = instance;
        this.selectedOutput = null;
        this.selectedInputInstance = null;
    }

    selectOutput(variable:ScalarVariable) {
        this.selectedOutput = variable;
        this.selectedInputInstance = null;
    }

    selectInputInstance(instance:Instance) {
        this.selectedInputInstance = instance;
    }

    getOutputs() {
        return this.selectedOutputInstance.fmu.scalarVariables
            .filter(variable => isCausalityCompatible(variable.causality, CausalityType.Output));
    }

    getInputs() {
        return this.selectedInputInstance.fmu.scalarVariables
            .filter(element => isCausalityCompatible(element.causality, CausalityType.Input) && isTypeCompatiple(element.type, this.selectedOutput.type));
    }
}