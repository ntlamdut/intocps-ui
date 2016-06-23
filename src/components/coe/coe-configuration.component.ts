import {Component, Input} from "@angular/core";
import {CoSimulationConfig} from "../../intocps-configurations/CoSimulationConfig";

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
                    <select class="form-control" required>
                        <option *ngFor="let option of options" [value]="option">{{option}}</option>
                    </select>
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
    @Input()
    config:CoSimulationConfig;

    submitted = false;
    onSubmit() { this.submitted = true; }
}