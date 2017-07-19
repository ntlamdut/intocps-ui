import {Component} from "@angular/core"; // , Input
import {TrOverviewComponent} from "./tr-overview.component";
import IntoCpsApp from "../../IntoCpsApp";
import {PanelComponent} from "../shared/panel.component";

@Component({
    selector: "tr-page",
    directives: [
        PanelComponent,
        TrOverviewComponent
//        MmOverviewComponent
    ],
    templateUrl: "./angular2-app/tr/tr-page.component.html",
})
export class TrPageComponent {
//    @Input()
//    path:string;
}