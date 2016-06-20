import { Component, OnInit, NgZone } from '@angular/core';

// Main application component.
// Handles routing between the pages that use Angular 2.

@Component({
    selector: 'app',
    template: `
        <h1 *ngIf="show === 'multiModel'">Multi model editor</h1>
        <h1 *ngIf="show === 'coe'">COE simulation</h1>
`
})
export class AppComponent implements OnInit {
    private show:string = 'nothing';

    constructor(private zone:NgZone) {

    }

    ngOnInit() {
        // Expose the Angular 2 application for the rest of the INTO-CPS application
        window.ng2app = this;
    }

    openCOE(path: string):void {
        this.zone.run(() => this.show = 'coe');
    }

    openMultiModel(path: string):void {
        this.zone.run(() => this.show = 'multiModel');
    }

    closeAll():void {
        this.zone.run(() => this.show = '');
    }
}