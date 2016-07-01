import {Component, Input, Output, EventEmitter, NgZone, OnInit, Pipe, PipeTransform} from "@angular/core";
import IntoCpsApp from "../../IntoCpsApp";
import {
    CoSimulationConfig, ICoSimAlgorithm, FixedStepAlgorithm,
    VariableStepAlgorithm
} from "../../intocps-configurations/CoSimulationConfig";
import {ScalarVariable, CausalityType, Instance} from "../../coe/fmi";

@Component({
    selector: "coe-configuration",
    templateUrl: "./components/coe/coe-configuration.component.html"
})
export class CoeConfigurationComponent implements OnInit {
    @Input()
    path:string;

    algorithms:Array<ICoSimAlgorithm> = [];

    private config:CoSimulationConfig;

    private algorithmConstructors = [
        FixedStepAlgorithm,
        VariableStepAlgorithm
    ];

    constructor(private zone:NgZone) {

    }

    ngOnInit() {
        let project = IntoCpsApp.getInstance().getActiveProject();

        CoSimulationConfig
            .parse(this.path, project.getRootFilePath(), project.getFmusPath())
            .then(config => {
                this.zone.run(() => this.config = config);

                // Create an array of the algorithm from the coe config and a new instance of all other algorithms
                this.algorithms = this.algorithmConstructors
                    .map(Algorithm =>
                        config.algorithm instanceof Algorithm
                            ? config.algorithm
                            : new Algorithm()
                    );
            });
    }

    onSubmit() {
        this.config.save();
    }

    getOutputs(scalarVariables:Array<ScalarVariable>) {
        return scalarVariables.filter(variable => variable.causality === CausalityType.Output);
    }

    isLivestreamChecked(instance:Instance, output:ScalarVariable) {
        let variables = this.config.livestream.get(instance);

        if (!variables) return false;

        return variables.includes(output);
    }

    onLivestreamChange(event:Event, instance:Instance, output:ScalarVariable) {
        let variables = this.config.livestream.get(instance);

        if (!variables) {
            variables = [];
            this.config.livestream.set(instance, variables);
        }

        if (event.target.checked)
            variables.push(output);
        else {
            variables.splice(variables.indexOf(output), 1);

            if (variables.length == 0)
                this.config.livestream.delete(instance);
        }
    }
}