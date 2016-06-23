import {Component, Input, OnInit} from "@angular/core";
import {FileSystemService} from "../shared/file-system.service";

@Component({
    selector: "coe-configuration",
    template: `
    <span *ngIf="!config">Loading ...</span>
    <div *ngIf="config">
        <h2>Config</h2>
    </div>
`
})
export class CoeConfigurationComponent {
    @Input()
    config:any;

}