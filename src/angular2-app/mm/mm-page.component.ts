import {Component, Input} from "@angular/core";

@Component({
    selector: "mm-page",
    templateUrl: "./angular2-app/mm/mm-page.component.html",
})
export class MmPageComponent {
    @Input()
    path:string;
}