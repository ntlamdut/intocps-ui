import {Component, Input, OnInit} from "@angular/core";
import {FileSystemService} from "../shared/file-system.service";

@Component({
    selector: "coe-configuration",
    template: `
    <div class="panel panel-default">
        <div class="panel-heading"><h3 class="panel-title">Configuration</h3></div>
        <div class="panel-body">
        </div>
    </div>
`
})
export class CoeConfigurationComponent {
    @Input()
    config:any;

}