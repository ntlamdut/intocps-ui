import {IntoCpsAppEvents} from "./IntoCpsAppEvents";
import {IntoCpsApp} from  "./IntoCpsApp";
import {DseController} from  "./dse/dse";
import {CreateTDGProjectController} from  "./rttester/CreateTDGProject";
import {CreateMCProjectController} from  "./rttester/CreateMCProject";
import {RunTestController} from  "./rttester/RunTest";
import {LTLEditorController} from "./rttester/LTLEditor"
import * as RTesterModalCommandWindow from "./rttester/GenericModalCommand";
import {BrowserController} from "./proj/projbrowserview";
import {IntoCpsAppMenuHandler} from "./IntoCpsAppMenuHandler";
import {ViewController, IViewController} from "./iViewController";
import * as CustomFs from "./custom-fs";
import {IProject} from "./proj/IProject";
import * as SystemUtil from "./SystemUtil";
import { bootstrap }    from '@angular/platform-browser-dynamic';
import {AppComponent} from './angular2-app/app.component';
import * as fs from 'fs';
import * as Path from 'path';

interface MyWindow extends Window {
    ng2app: AppComponent;
}

declare var window: MyWindow;

import * as Menus from "./menus";
import {provideForms, disableDeprecatedForms} from "@angular/forms";

class InitializationController {
    // constants
    mainViewId: string = "mainView";
    layout: W2UI.W2Layout;
    title: HTMLTitleElement;
    mainView: HTMLDivElement;

    constructor() {
        $(document).ready(() => this.initialize());
    }
    private initialize() {
        this.setTitle();
        this.configureLayout();
        this.loadViews();
    }
    private configureLayout() {
        let layout: HTMLDivElement = <HTMLDivElement>document.querySelector("#layout");
        let pstyle = "border: 1px solid #dfdfdf; padding: 5px; background-color: #FFFFFF";
        this.layout = $(layout).w2layout({
            name: "layout",
            padding: 4,
            panels: [
                { type: "left", size: 200, resizable: true, style: pstyle },
                { type: "main", style: pstyle },
            ]
        });
    }
    private setTitle() {
        // Set the title to the project name
        this.title = <HTMLTitleElement>document.querySelector("title");
        let app: IntoCpsApp = IntoCpsApp.getInstance();
        let p = app.getActiveProject();
        if (p != null) {
            this.title.innerText = "Project: " + p.getName() + " - " + p.getRootFilePath();
        }
        let ipc: Electron.IpcRenderer = require("electron").ipcRenderer;
        ipc.on(IntoCpsAppEvents.PROJECT_CHANGED, (event, arg) => {
            let p = app.getActiveProject();
            this.title.innerText = "Project: " + p.getName() + " - " + p.getRootFilePath();
        });
    }

    private loadViews() {
        this.layout.load("main", "main.html", "", () => {
            this.mainView = (<HTMLDivElement>document.getElementById(this.mainViewId));

            // Start Angular 2 application
            bootstrap(AppComponent, [disableDeprecatedForms(), provideForms()]);
        });
        this.layout.load("left", "proj/projbrowserview.html", "", () => {
            browserController.initialize();
        });
    }
}

// Initialise controllers
let menuHandler: IntoCpsAppMenuHandler = new IntoCpsAppMenuHandler();
let browserController: BrowserController = new BrowserController(menuHandler);
let init = new InitializationController();
let controller: IViewController;

function closeView():boolean {
    if (controller && controller.deInitialize)
        return controller.deInitialize();
    else
        return true;
}

function openView(htmlPath:string, callback?:(mainView:HTMLDivElement) => void | IViewController) {
    if (!closeView()) return;

    $(init.mainView).load(htmlPath, () => {
        controller = null;

        if (callback) {
            let newController = callback(init.mainView);

            if (newController) {
                controller = <IViewController>newController;
                controller.initialize();
            }
        }
    });
}

menuHandler.openCoeView = (path:string) => {
    IntoCpsApp.setTopName(path.split('\\').reverse()[1]);
    $(init.mainView).empty();
    window.ng2app.openCOE(path);
};

menuHandler.openMultiModel = (path:string) => {
    IntoCpsApp.setTopName(path.split('\\').reverse()[1]);
    $(init.mainView).empty();
    window.ng2app.openMultiModel(path);
};

menuHandler.runRTTesterCommand = (commandSpec: any) => {
    openView("rttester/GenericModalCommand.html", () => {
        RTesterModalCommandWindow.initialize(commandSpec);
        (<any>$('#modalDialog')).modal({ keyboard: false, backdrop: false });
    });
};

menuHandler.createTDGProject = (path: string) => {
    openView("rttester/CreateTDGProject.html", view => new CreateTDGProjectController(view, path));
};

menuHandler.createMCProject = (path: string) => {
    openView("rttester/CreateMCProject.html", view => new CreateMCProjectController(view, path));
};

menuHandler.runTest = (path: string) => {
    openView("rttester/RunTest.html", view => new RunTestController(view, path));
};

menuHandler.openLTLFile = (fileName: string) => {
    openView("rttester/LTLEditor.html", view => new LTLEditorController(view, fileName));
};

menuHandler.openSysMlExport = () => {
    openView("sysmlexport/sysmlexport.html");
    IntoCpsApp.setTopName("SysML Export");
};

menuHandler.openFmu = () => {
    openView("fmus/fmus.html");
    IntoCpsApp.setTopName("FMUs");
};

menuHandler.openDseView = (path) => {
    openView("dse/dse.html", view => new DseController(view));
};

menuHandler.createDse = (path) => {
    // create empty DSE file and load it.
    openView("dse/dse.html", () => {
        menuHandler.openDseView("");
    });
};

menuHandler.createDsePlain = () => {
    openView("dse/dse.html", () => {
        let project: IProject = require("electron").remote.getGlobal("intoCpsApp").getActiveProject();
        if (project != null) {
            let name = "new";
            let content = "{}";
            let dsePath = project.createDse("dse-" + name + " (" + Math.floor(Math.random() * 100) + ")", content);
            IntoCpsApp.getInstance().emit(IntoCpsAppEvents.PROJECT_CHANGED);
            menuHandler.openDseView(dsePath + "");
        }
    });
};

menuHandler.createMultiModel = (path) => {
    let project = IntoCpsApp.getInstance().getActiveProject();

    if (project) {
        let name = Path.basename(path, ".sysml.json");
        let content = fs.readFileSync(path, "UTF-8");
        let mmPath = project.createMultiModel(`mm-${name} (${Math.floor(Math.random() * 100)})`, content);
        menuHandler.openMultiModel(mmPath);
    }
};

menuHandler.createMultiModelPlain = () => {
    let project = IntoCpsApp.getInstance().getActiveProject();

    if (project) {
        let mmPath = project.createMultiModel(`mm-new (${Math.floor(Math.random() * 100)})`, "{}");
        menuHandler.openMultiModel(mmPath);
    }
};

menuHandler.createCoSimConfiguration = (path) => {
    let project = IntoCpsApp.getInstance().getActiveProject();

    if (project) {
        let coePath = project.createCoSimConfig(path, `co-sim-${Math.floor(Math.random() * 100)}`, null).toString();
        menuHandler.openCoeView(coePath);
    }
};

menuHandler.deletePath = (path) => {
    let name = Path.basename(path);
    if (name.indexOf('R_') >= 0) {
        console.info("Deleting " + path);
        CustomFs.getCustomFs().removeRecursive(path, function (err: any, v: any) {
            if (err != null) {
                console.error(err);
            }
            IntoCpsApp.getInstance().emit(IntoCpsAppEvents.PROJECT_CHANGED);
        });

    } else if (name.endsWith(".coe.json") || name.endsWith(".mm.json")) {
        let dir = Path.dirname(path);
        console.info("Deleting " + dir);
        CustomFs.getCustomFs().removeRecursive(dir, function (err: any, v: any) {
            if (err != null) {
                console.error(err);
            }
            IntoCpsApp.getInstance().emit(IntoCpsAppEvents.PROJECT_CHANGED);
        });
    }
};

menuHandler.openWithSystemEditor = (path) => {
    SystemUtil.openPath(path);
};


Menus.configureIntoCpsMenu();
