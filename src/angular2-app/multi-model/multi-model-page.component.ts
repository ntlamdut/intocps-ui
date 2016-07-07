import {Component, Input} from "@angular/core";

@Component({
    selector: "multi-model-page",
    templateUrl: "./components/multi-model/multi-model-page.component.html",
})
export class MultiModelPageComponent {
    @Input()
    path:string;
}