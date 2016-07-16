import { Input, Component, OnInit } from '@angular/core';

@Component({
    selector: 'panel',
    templateUrl: "./angular2-app/shared/panel.component.html",
})
export class PanelComponent {
    @Input()
    open:boolean = true;

    @Input()
    title:string = "";
}