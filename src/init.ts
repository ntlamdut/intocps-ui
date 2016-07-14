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
import * as SystemUtil from "./SystemUtil";
import {bootstrap} from '@angular/platform-browser-dynamic';
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

function closePage():Promise<void> {
    return new Promise((resolve, reject) => {
        window.ng2app.closePage()
            .then(() => {
                if (controller && controller.deInitialize) {
                    if (controller.deInitialize())
                        resolve();
                    else
                        reject();
                }
            }, () => reject());
    });
}

function openView(htmlPath:string, callback?:(mainView:HTMLDivElement) => IViewController) {
    closePage()
        .then(() => $(init.mainView).load(htmlPath, () => {
            if (!callback) return;

            let newController = callback(init.mainView);

            if (newController) {
                controller = newController;
                controller.initialize();
            }
        }));
}

menuHandler.openCoeView = (path:string) => {
    closePage()
        .then(() => {
            IntoCpsApp.setTopName("Multi Model > COE");
            window.ng2app.openCOE(path);
        });
};

menuHandler.openMultiModel = (path:string) => {
    closePage()
        .then(() => {
            IntoCpsApp.setTopName("Multi Model");
            window.ng2app.openMultiModel(path);
        });
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

menuHandler.openDseView = () => {
    openView("dse/dse.html", view => new DseController(view));
};

menuHandler.createDse = () => {
    // create empty DSE file and load it.
    openView("dse/dse.html", () => {
        menuHandler.openDseView("");
    });
};

menuHandler.createDsePlain = () => {
    openView("dse/dse.html", () => {
        let instance = IntoCpsApp.getInstance();
        let project = instance.getActiveProject();

        if (project) {
            let dsePath = project.createDse(`dse-new (${Math.floor(Math.random() * 100)})`, "{}");

            instance.emit(IntoCpsAppEvents.PROJECT_CHANGED);
            menuHandler.openDseView(dsePath);
        }
    });
};

menuHandler.createMultiModel = (path) => {
    openView("multimodel/multimodel.html", () => {
        let instance = IntoCpsApp.getInstance();
        let project = instance.getActiveProject();

        if (project) {
            let name = Path.basename(path, ".sysml.json");
            let content = fs.readFileSync(path, "UTF-8");

            let mmPath = project.createMultiModel(`mm-${name} (${Math.floor(Math.random() * 100)})`, content);

            instance.emit(IntoCpsAppEvents.PROJECT_CHANGED);
            menuHandler.openMultiModel(mmPath);
        }
    });
};

menuHandler.createMultiModelPlain = () => {
    openView("multimodel/multimodel.html", () => {
        let instance = IntoCpsApp.getInstance();
        let project = instance.getActiveProject();

        if (project) {
            let mmPath = project.createMultiModel(`mm-new (${Math.floor(Math.random() * 100)})`, "{}");

            instance.emit(IntoCpsAppEvents.PROJECT_CHANGED);
            menuHandler.openMultiModel(mmPath);
        }
    });
};

menuHandler.createCoSimConfiguration = (path:string) => {
    openView("coe/coe.html", () => {
        let instance = IntoCpsApp.getInstance();
        let project = instance.getActiveProject();

        if (project) {
            let coePath = project.createCoSimConfig(path, `co-sim-${Math.floor(Math.random() * 100)}`, null);

            instance.emit(IntoCpsAppEvents.PROJECT_CHANGED);
            menuHandler.openCoeView(coePath);
        }
    });
};

menuHandler.deletePath = (path:string) => {
    let name = Path.basename(path);
    let instance = IntoCpsApp.getInstance();
    let pathToRemove:string;

    if (name.indexOf('R_') >= 0)
        pathToRemove = path;
    else if (name.endsWith(".coe.json") || name.endsWith(".mm.json"))
        pathToRemove = Path.dirname(path);

    if (pathToRemove) {
        CustomFs.getCustomFs().removeRecursive(pathToRemove, error => {
            if (error) console.error(error);

            instance.emit(IntoCpsAppEvents.PROJECT_CHANGED);
        });
    }
};

menuHandler.openWithSystemEditor = (path) => {
    SystemUtil.openPath(path);
};


Menus.configureIntoCpsMenu();
