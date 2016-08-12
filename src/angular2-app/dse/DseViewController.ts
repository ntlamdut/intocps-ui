import {ViewController} from "../../iViewController";
import IntoCpsApp from "../../IntoCpsApp";
import {AppComponent} from "../app.component";

interface MyWindow extends Window {
    ng2app: AppComponent;
}

declare var window: MyWindow;

export class DseViewController extends ViewController {
    constructor(view: HTMLDivElement, private path:string) {
        super(view);
    }

    initialize() {
        //IntoCpsApp.setTopName(this.path.split('\\').reverse()[1]);
        IntoCpsApp.setTopName(this.path);
        window.ng2app.openDSE(this.path);
    }

    deInitialize() {
        if (window.ng2app.navigationService.canNavigate()) {
            window.ng2app.closeAll();
            return true;
        }

        return false;
    }
}