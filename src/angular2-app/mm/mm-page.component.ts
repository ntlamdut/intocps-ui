import {Component, Input} from "@angular/core";
import {MmConfigurationComponent} from "./mm-configuration.component";
import {MmOverviewComponent} from "./mm-overview.component";
import {MultiModelConfig} from "../../intocps-configurations/MultiModelConfig";
import IntoCpsApp from "../../IntoCpsApp";

@Component({
    selector: "mm-page",
    directives: [
        MmConfigurationComponent,
        MmOverviewComponent
    ],
    templateUrl: "./angular2-app/mm/mm-page.component.html",
})
export class MmPageComponent {
    @Input()
    path:string;
}