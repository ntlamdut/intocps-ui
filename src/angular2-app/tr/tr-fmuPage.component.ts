import {Component , Input} from "@angular/core";
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
    templateUrl: "./angular2-app/tr/trFMU-page.component.html",
})
export class TrFMUPageComponent {
    @Input()
    path:string;
}