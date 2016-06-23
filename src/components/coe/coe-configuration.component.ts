import {Component, Input} from "@angular/core";
import {
    CoSimulationConfig, ICoSimAlgorithm, FixedStepAlgorithm,
    VariableStepAlgorithm
} from "../../intocps-configurations/CoSimulationConfig";

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
                
                <div class="form-group">
                    <label>Livestream Configuration</label>
                </div>
                
                <button type="submit" class="btn btn-default" [disabled]="!configForm.form.valid">Save</button>
            </form>
        </div>
    </div>
`
})
export class CoeConfigurationComponent {
    private _config:CoSimulationConfig;

    @Input()
    set config(config:CoSimulationConfig) {
        this._config = config;

        if (!config) return;

        let algorithmConstructors = [
            FixedStepAlgorithm,
            VariableStepAlgorithm
        ];

        // Create an array of the algorithm from the coe config and a new instance of all other algorithms
        this.algorithms = algorithmConstructors
            .map(Algorithm =>
                config.algorithm instanceof Algorithm
                    ? config.algorithm
                    : new Algorithm()
            );
    }
    get config():CoSimulationConfig {
        return this._config;
    }

    algorithms:Array<ICoSimAlgorithm> = [];

    onSubmit() {

    }
}