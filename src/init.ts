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
import {SourceDom} from "./sourceDom";
import {IViewController} from "./iViewController";
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

function openViewController(htmlPath: string, path: string, controllerPar: new (mainDiv: HTMLDivElement) => IViewController) {
    window.ng2app.closeAll();

    $(init.mainView).load(htmlPath, (event: JQueryEventObject) => {
        controller = new controllerPar(init.mainView);
        if (controller.initialize) {
            controller.initialize(new SourceDom(path));
        }
    });
}

function openView(htmlPath:string, callback?:(event:JQueryEventObject) => void) {
    window.ng2app.closeAll();

    $(init.mainView).load(htmlPath, callback);
}

menuHandler.deInitialize = () => {
    if (controller != null && controller.deInitialize)
        return controller.deInitialize();
    else
        return true;
};

menuHandler.openCoeView = (path:string) => {
    $(init.mainView).empty();
    window.ng2app.openCOE(path);
};

menuHandler.openMultiModel = (path:string) => {
    $(init.mainView).empty();
    window.ng2app.openMultiModel(path);
};

menuHandler.runRTTesterCommand = (commandSpec: any) => {
    $("#modalDialog").load("rttester/GenericModalCommand.html", (event: JQueryEventObject) => {
        RTesterModalCommandWindow.initialize(commandSpec);
        (<any>$('#modalDialog')).modal({ keyboard: false, backdrop: false });
    });
};

menuHandler.createTDGProject = (path: string) => {
    openView("rttester/CreateTDGProject.html", (event: JQueryEventObject) => {
        controller = new CreateTDGProjectController(init.mainView, path);
    });
};

menuHandler.createMCProject = (path: string) => {
    openView("rttester/CreateMCProject.html", (event: JQueryEventObject) => {
        controller = new CreateMCProjectController(init.mainView, path);
    });
};

menuHandler.runTest = (path: string) => {
    openView("rttester/RunTest.html", (event: JQueryEventObject) => {
        controller = new RunTestController(init.mainView, path);
    });
};

menuHandler.openLTLFile = (fileName: string) => {
    $(init.mainView).load("rttester/LTLEditor.html", (event: JQueryEventObject) => {
        controller = new LTLEditorController(init.mainView, fileName);
    });
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
    openViewController("dse/dse.html", path, DseController);
};

menuHandler.createDse = (path) => {
    openView("dse/dse.html", (event: JQueryEventObject) => {
        // create empty DSE file and load it.
        menuHandler.openDseView("")
    });
};

menuHandler.createDsePlain = () => {
    openView("dse/dse.html", (event: JQueryEventObject) => {
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
    openView("multimodel/multimodel.html", (event: JQueryEventObject) => {
        let project: IProject = require("electron").remote.getGlobal("intoCpsApp").getActiveProject();
        if (project != null) {
            let name = Path.basename(path, ".sysml.json");
            let content = fs.readFileSync(path, "UTF-8");
            let mmPath = project.createMultiModel("mm-" + name + " (" + Math.floor(Math.random() * 100) + ")", content);
            IntoCpsApp.getInstance().emit(IntoCpsAppEvents.PROJECT_CHANGED);
            menuHandler.openMultiModel(mmPath + "");
        }
    });
};

menuHandler.createMultiModelPlain = () => {
    openView("multimodel/multimodel.html", (event: JQueryEventObject) => {
        let project: IProject = require("electron").remote.getGlobal("intoCpsApp").getActiveProject();
        if (project != null) {
            let name = "new";
            let content = "{}";
            let mmPath = project.createMultiModel("mm-" + name + " (" + Math.floor(Math.random() * 100) + ")", content);
            IntoCpsApp.getInstance().emit(IntoCpsAppEvents.PROJECT_CHANGED);
            menuHandler.openMultiModel(mmPath + "");
        }
    });
};

menuHandler.createCoSimConfiguration = (path) => {
    openView("coe/coe.html", function (event: JQueryEventObject) {
        let project: IProject = require("electron").remote.getGlobal("intoCpsApp").getActiveProject();
        if (project != null) {
            let coePath: string = project.createCoSimConfig(path + "", "co-sim-" + Math.floor(Math.random() * 100), null).toString();
            IntoCpsApp.getInstance().emit(IntoCpsAppEvents.PROJECT_CHANGED);
            menuHandler.openCoeView(coePath);
        }
    });
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
