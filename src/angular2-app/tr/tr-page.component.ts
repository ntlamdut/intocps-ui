import {Component} from "@angular/core"; // , Input
import {TrResultComponent} from "./tr-result.component";
import {TrUserComponent} from "./tr-user.component";
import {TrFUMsComponent} from "./tr-fmus.component";
import {ReqNoResultComponent} from "./tr-reqnores.component";
import {ReqNoPosResultComponent} from "./tr-reqnopos.component";
import {ReqOneResultComponent} from "./tr-reqoneres.component";
import IntoCpsApp from "../../IntoCpsApp";
import {PanelComponent} from "../shared/panel.component";

@Component({
    selector: "tr-page",
    directives: [
        PanelComponent,
        TrResultComponent,
        TrFUMsComponent,
        TrUserComponent,
        ReqNoResultComponent,
        ReqNoPosResultComponent,
        ReqOneResultComponent
        
//        MmOverviewComponent
    ],
    templateUrl: "./angular2-app/tr/tr-page.component.html",
})
export class TrPageComponent {
//    @Input()
//    path:string;
}