import {ViewController} from "../../iViewController";
import IntoCpsApp from "../../IntoCpsApp";
import {AppComponent} from "../app.component";

interface MyWindow extends Window {
    ng2app: AppComponent;
}

declare var window: MyWindow;

export class MmViewController extends ViewController {
    constructor(view: HTMLDivElement, private path:string) {
        super(view);
    }

    initialize() {
        IntoCpsApp.setTopName(this.path.split('\\').reverse()[1]);
        window.ng2app.openMultiModel(this.path);
    }

    deInitialize() {
        window.ng2app.closeAll();

        return true;
    }
}