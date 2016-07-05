import {Component, Input, NgZone, OnInit} from "@angular/core";
import IntoCpsApp from "../../IntoCpsApp";
import {
    CoSimulationConfig, ICoSimAlgorithm, FixedStepAlgorithm,
    VariableStepAlgorithm, ZeroCrossingConstraint, BoundedDifferenceConstraint, SamplingRateConstraint
} from "../../intocps-configurations/CoSimulationConfig";
import {ScalarVariable, CausalityType, Instance} from "../../coe/fmi";
import {ZeroCrossingComponent} from "./inputs/zero-crossing.component";
import {BoundedDifferenceComponent} from "./inputs/bounded-difference.component";
import {SamplingRateComponent} from "./inputs/sampling-rate.component";

@Component({
    selector: "coe-configuration",
    directives: [
        ZeroCrossingComponent,
        BoundedDifferenceComponent,
        SamplingRateComponent
    ],
    templateUrl: "./components/coe/coe-configuration.component.html"
})
export class CoeConfigurationComponent implements OnInit {
    @Input()
    path:string;

    algorithms:Array<ICoSimAlgorithm> = [];
    newConstraint:FunctionConstructor;

    private config:CoSimulationConfig;

    private algorithmConstructors = [
        FixedStepAlgorithm,
        VariableStepAlgorithm
    ];

    private constraintConstructors = [
        ZeroCrossingConstraint,
        BoundedDifferenceConstraint,
        SamplingRateConstraint
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
                    .map(constructor =>
                        config.algorithm instanceof constructor
                            ? config.algorithm
                            : new constructor()
                    );
            });
    }

    onSubmit() {
        this.config.save();
    }

    getOutputs(scalarVariables:Array<ScalarVariable>) {
        return scalarVariables.filter(variable => variable.causality === CausalityType.Output);
    }

    addConstraint() {
        if (!this.newConstraint) return;

        this.config.algorithm.constraints.push(new this.newConstraint());
    }

    getAlgorithmName(algorithm:any) {
        if (algorithm === FixedStepAlgorithm || algorithm instanceof FixedStepAlgorithm)
            return "Fixed Step";

        if (algorithm === VariableStepAlgorithm || algorithm instanceof VariableStepAlgorithm)
            return "Variable Step";
    }

    getConstraintName(constraint:any) {
        if (constraint === ZeroCrossingConstraint || constraint instanceof ZeroCrossingConstraint)
            return "Zero Crossing";

        if (constraint === BoundedDifferenceConstraint || constraint instanceof BoundedDifferenceConstraint)
            return "Bounded Difference";

        if (constraint === SamplingRateConstraint || constraint instanceof SamplingRateConstraint)
            return "Sampling Rate";
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