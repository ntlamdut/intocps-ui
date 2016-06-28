import {Component, Input, Output, EventEmitter, NgZone, OnInit, Pipe, PipeTransform} from "@angular/core";
import IntoCpsApp from "../../IntoCpsApp";
import {
    CoSimulationConfig, ICoSimAlgorithm, FixedStepAlgorithm,
    VariableStepAlgorithm
} from "../../intocps-configurations/CoSimulationConfig";
import {ScalarVariable, CausalityType, Instance} from "../../coe/fmi";

@Component({
    selector: "coe-configuration",
    template: `
    <div class="panel panel-default">
        <div class="panel-heading"><h3 class="panel-title">Configuration</h3></div>
        <div class="panel-body">
            <form *ngIf="config" (ngSubmit)="onSubmit()" #configForm="ngForm">
                <div class="form-group">
                    <label>Start time</label>
                    <input name="startTime" [(ngModel)]="config.startTime" class="form-control" required>
                </div>
                
                <div class="form-group">
                    <label>End time</label>
                    <input name="endTime" [(ngModel)]="config.endTime" class="form-control" required>
                </div>
                
                <hr>
        
                <div class="form-group">
                    <label>Algorithm</label>
                    <select name="algorithm" [(ngModel)]="config.algorithm" class="form-control" required>
                        <option *ngFor="let algorithm of algorithms" [ngValue]="algorithm">{{algorithm.name}}</option>
                    </select>
                </div>
                
                <div *ngIf="config.algorithm.name == 'Fixed step'" class="form-group">
                    <label>Step size</label>
                    <input name="stepSize" [(ngModel)]="config.algorithm.size" class="form-control" required>
                </div>
                
                <div *ngIf="config.algorithm.name == 'Variable step'" class="form-group">
                    <label>Initial step size</label>
                    <input name="initStepSize" [(ngModel)]="config.algorithm.initSize" class="form-control" required>
                    <label>Minimum step size</label>
                    <input name="minStepSize" [(ngModel)]="config.algorithm.sizeMin" class="form-control" required>
                    <label>Maximum step size</label>
                    <input name="maxStepSize" [(ngModel)]="config.algorithm.sizeMax" class="form-control" required>
                </div>
                
                <hr>
                
                <div class="form-group">
                    <label>Livestream Configuration</label>
                    <div *ngFor="let instance of config.multiModel.fmuInstances">
                        <label>{{instance.fmu.name}}.{{instance.name}}</label>
                        <div class="checkbox" *ngFor="let output of getOutputs(instance.fmu.scalarVariables)">
                            <label>
                                <input type="checkbox"
                                    [checked]="isLivestreamChecked(instance, output)" 
                                    (change)="onLivestreamChange($event, instance, output)">
                                    
                                {{output.name}}
                                </label>
                        </div>
                    </div>
                </div>
                
                <hr>
                
                <button type="submit" class="btn btn-default" [disabled]="!configForm.form.valid">
                    <span class="glyphicon glyphicon-floppy-saved" aria-hidden="true"></span> Save
                </button>
            </form>
        </div>
    </div>
`
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