import {Component, Input, EventEmitter, Output, NgZone} from "@angular/core";
import {FORM_DIRECTIVES, REACTIVE_FORM_DIRECTIVES, Validators, FormArray, FormControl, FormGroup} from "@angular/forms";
import IntoCpsApp from "../../IntoCpsApp";
import {
    CoSimulationConfig, ICoSimAlgorithm, FixedStepAlgorithm,
    VariableStepAlgorithm, ZeroCrossingConstraint, BoundedDifferenceConstraint, SamplingRateConstraint,
    VariableStepConstraint
} from "../../intocps-configurations/CoSimulationConfig";
import {ScalarVariable, CausalityType, Instance, InstanceScalarPair} from "./models/Fmu";
import {ZeroCrossingComponent} from "./inputs/zero-crossing.component";
import {BoundedDifferenceComponent} from "./inputs/bounded-difference.component";
import {SamplingRateComponent} from "./inputs/sampling-rate.component";
import {numberValidator, lessThanValidator} from "../shared/validators";
import {NavigationService} from "../shared/navigation.service";
import {WarningMessage} from "../../intocps-configurations/Messages";

@Component({
    selector: "coe-configuration",
    directives: [
        FORM_DIRECTIVES,
        REACTIVE_FORM_DIRECTIVES,
        ZeroCrossingComponent,
        BoundedDifferenceComponent,
        SamplingRateComponent
    ],
    templateUrl: "./angular2-app/coe/coe-configuration.component.html"
})
export class CoeConfigurationComponent {
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

    form:FormGroup;
    algorithms:ICoSimAlgorithm[] = [];
    algorithmFormGroups = new Map<ICoSimAlgorithm, FormGroup>();
    outputPorts:Array<InstanceScalarPair> = [];
    newConstraint: new (...args: any[]) => VariableStepConstraint;
    editing:boolean = false;
    parseError:string = null;
    warnings: WarningMessage[] = [];
    loglevels : string[] = ["Not set","ERROR" ,"WARN","INFO","DEBUG","TRACE" ];

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

    constructor(private zone:NgZone, private navigationService: NavigationService) {
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
                        .reduce((a, b) => a.concat(...b));

                    // Create a form group for validation
                    this.form = new FormGroup({
                        startTime: new FormControl(config.startTime, [Validators.required, numberValidator]),
                        endTime: new FormControl(config.endTime, [Validators.required, numberValidator]),
                        livestreamInterval: new FormControl(config.livestreamInterval, [Validators.required, numberValidator]),
                        algorithm: this.algorithmFormGroups.get(this.config.algorithm)
                    }, null, lessThanValidator('startTime', 'endTime'));
                });
            }, error => this.zone.run(() => this.parseError = error));
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

    onAlgorithmChange(algorithm:ICoSimAlgorithm) {
        this.config.algorithm = algorithm;

        this.form.removeControl('algorithm');
        this.form.addControl('algorithm', this.algorithmFormGroups.get(algorithm));
    }

    onSubmit() {
        if (!this.editing) return;

        this.warnings = this.config.validate();

        if (this.warnings.length > 0) return;

        this.config.save()
            .then(() => this.change.emit(this.path));

        this.editing = false;
    }

    getOutputs(scalarVariables:Array<ScalarVariable>) {
        return scalarVariables.filter(variable => (variable.causality === CausalityType.Output || variable.causality === CausalityType.Local));
    }

    addConstraint() {
        if (!this.newConstraint) return;

        let algorithm = <VariableStepAlgorithm> this.config.algorithm;
        let formArray = <FormArray> this.form.find('algorithm').find('constraints');

        let constraint = new this.newConstraint();

        algorithm.constraints.push(constraint);
        formArray.push(constraint.toFormGroup());
    }

    removeConstraint(constraint:VariableStepConstraint) {
        let algorithm = <VariableStepAlgorithm> this.config.algorithm;
        let formArray = <FormArray> this.form.find('algorithm').find('constraints');
        let index = algorithm.constraints.indexOf(constraint);

        algorithm.constraints.splice(index, 1);
        formArray.removeAt(index);
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

        return variables.indexOf(output) !== -1;
    }

    onLivestreamChange(enabled:boolean, instance:Instance, output:ScalarVariable) {
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
}