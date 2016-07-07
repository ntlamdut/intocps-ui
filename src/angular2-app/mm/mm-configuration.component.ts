import {Component, Input} from "@angular/core";

@Component({
    selector: "mm-configuration",
    templateUrl: "./angular2-app/mm/mm-configuration.component.html"
})
export class MmConfigurationComponent {
    @Input()
    path:string;
}