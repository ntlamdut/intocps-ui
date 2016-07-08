import {Component, Input} from "@angular/core";
import {MmConfigurationComponent} from "./mm-configuration.component";

@Component({
    selector: "mm-page",
    directives: [
        MmConfigurationComponent
    ],
    templateUrl: "./angular2-app/mm/mm-page.component.html",
})
export class MmPageComponent {
    @Input()
    path:string;
}