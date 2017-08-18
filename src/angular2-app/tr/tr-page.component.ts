import {Component , Input} from "@angular/core";
import {TrResultComponent} from "./tr-result.component";
import IntoCpsApp from "../../IntoCpsApp";
import {PanelComponent} from "../shared/panel.component";

@Component({
    selector: "tr-page",
    directives: [
        PanelComponent,
        TrResultComponent
//        MmOverviewComponent
    ],
    templateUrl: "./angular2-app/tr/tr-page.component.html",
})
export class TrPageComponent {
    @Input()
    path?:string;
}