import {Component} from "@angular/core"; // , Input
import {TrFUMsComponent} from "./tr-fmus.component";
import IntoCpsApp from "../../IntoCpsApp";
import {PanelComponent} from "../shared/panel.component";

@Component({
    selector: "tr-FMUpage",
    directives: [
        PanelComponent,
        TrFUMsComponent
//        MmOverviewComponent
    ],
    templateUrl: "./angular2-app/tr/tr-page.component.html",
})
export class TrFMUPageComponent {
//    @Input()
//    path:string;
}