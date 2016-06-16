///<reference path="../../typings/browser/ambient/github-electron/index.d.ts"/>
///<reference path="../../typings/browser/ambient/node/index.d.ts"/>
///<reference path="../../typings/browser/ambient/jquery/index.d.ts"/>
///<reference path="../../typings/browser/ambient/w2ui/index.d.ts"/>

import {IntoCpsAppEvents} from "../IntoCpsAppEvents";
import {IntoCpsApp} from  "../IntoCpsApp"
import {Project} from "./Project";
import {IProject} from "./IProject";
import fs = require('fs');
import Path = require('path');
import {SettingKeys} from "../settings/SettingKeys";
import {RTTester} from "../rttester/RTTester";
import * as RTesterModalCommandWindow from "../rttester/GenericModalCommand";
import {IntoCpsAppMenuHandler} from "../IntoCpsAppMenuHandler";
import {Utilities} from "../utilities";

export class MenuEntry {
    id: string;
    text: string;
    icon: any;
    item: ProjectBrowserItem;
    callback: (item: ProjectBrowserItem) => void;
    private static idCounter: number = 0;
    constructor(item: ProjectBrowserItem, text: string, icon: any,
        callback: (item: ProjectBrowserItem) => void = undefined) {
        this.id = "MenuEntry_" + (MenuEntry.idCounter++).toString();
        this.item = item;
        this.text = text;
        this.icon = icon;
        if (callback != undefined) {
            this.callback = callback;
        } else {
            this.callback = function (item: ProjectBrowserItem) { };
        }
    }
}

export class ProjectBrowserItem {
    controller: BrowserController;
    id: string;
    path: string;
    isDirectory: boolean;
    text: string;
    level: number;
    expanded: boolean = false;
    img: any = null;
    childNodes: ProjectBrowserItem[] = [];
    parentNode: ProjectBrowserItem;
    group: boolean = false;
    fsWatch: fs.FSWatcher;
    opensInMainWindow: boolean = false;

    clickHandler(item: ProjectBrowserItem): void { }
    dblClickHandler(item: ProjectBrowserItem): void { }
    menuEntries: MenuEntry[] = [];

    private static idCounter: number = 0;
    constructor(controller: BrowserController, path: string, parent: ProjectBrowserItem) {
        this.controller = controller;
        let self = this;
        this.id = "ProjectBrowserItem_" + (ProjectBrowserItem.idCounter++).toString();
        this.path = path;
        this.isDirectory = fs.statSync(path).isDirectory();
        this.text = Path.basename(path);
        this.parentNode = parent;
        if (parent == null) {
            this.level = 0;
        } else {
            this.level = parent.level + 1;
        }
        if (this.level <= 1) {
            this.group = true;
            this.expanded = true;
        }
    }

    removeFileExtensionFromText(): void {
        this.text = this.text.substr(0, this.text.indexOf('.'));
    }

    getChildByPath(path: string) {
        return this.childNodes.find((n) => { return n.path == path; });
    }

    getChildByID(id: string) {
        return this.childNodes.find((n) => { return n.id == id; });
    }

    activate() {
        console.log("activating node " + this.id + ": " + this.path);
        let parent = this.parentNode;
        if (parent != null) {
            let i: number = 0;
            for (; i < parent.childNodes.length && parent.childNodes[i].path.localeCompare(this.path) < 0; ++i);
            if (this.level <= 1) {
                this.controller.tree.insert(null, this);
            } else {
                let before = (i + 1) < parent.childNodes.length ? parent.childNodes[i + 1].id : null;
                this.controller.tree.insert(parent.id, before, this);
            }
            parent.childNodes.splice(i, 0, this);
        }
        if (this.expanded || parent.expanded) {
            this.loadChildren();
        }
    }

    watch() {
        let self = this;
        //console.log("watching node " + this.path + ": " + this.path);
        if (this.isDirectory) {
            if (this.fsWatch != undefined) throw "Directory is already being watched";
            let exists = (p: string) => { try { let x = fs.statSync(p); return true; } catch (e) { return false; } }
            this.fsWatch = fs.watch(this.path, function (event: string, which: string) {
                console.log("item: " + self.path, ", who: " + which + ", event: " + event);
                if (which) {
                    let p = Path.join(self.path, Path.basename(which));
                    let child = self.getChildByPath(p);
                    if (child)
                        child.deactivate();
                    if (exists(p))
                        self.controller.addFSItem(p, self);
                    self.controller.tree.refresh(self.id);
                }
            });
        }
    }

    unwatch() {
        if (this.fsWatch != undefined) {
            //console.log("unwatching node " + this.path + ": " + this.path);
            this.fsWatch.close();
            this.fsWatch = undefined;
        }
    }

    deactivate() {
        for (let c of this.childNodes) {
            c.deactivate();
        }
        console.log("deactivating node " + this.path + ": " + this.path);
        this.unwatch();
        this.controller.tree.remove(this.id);
        if (this.parentNode != null) {
            this.parentNode.childNodes.splice(this.parentNode.childNodes.indexOf(this),1);
        }
        if (this.parentNode.getChildByID(this.id) != undefined)
            throw "node is still a child."
    }

    releaseChildren(depth: number = 0) {
        if (depth > 0) {
            for (var c of this.childNodes) {
                c.releaseChildren(depth - 1);
            }
        } else {
            while (this.childNodes.length != 0) {
                this.childNodes[0].deactivate();
            }
            if (this.childNodes.length != 0)
                throw "node has still children."
            this.unwatch();
        }
    }

    loadChildren(depth: number = 0) {
        if (depth > 0) {
            for (var c of this.childNodes) {
                c.loadChildren(depth - 1);
            }
        } else if (this.isDirectory) {
            this.controller.addFSFolderContent(this.path, this);
            this.watch();
        }
    }

    expand() {
        // load grand-children
        this.loadChildren(1);
    }

    collapse() {
        // discard grand-children
        this.releaseChildren(1);
        this.controller.tree.collapseAll(this.id);
    }

}

export class BrowserController {
    private browser: HTMLDivElement;
    public tree: W2UI.W2Sidebar;
    rootItem: ProjectBrowserItem;

    private menuHandler: IntoCpsAppMenuHandler = null;

    constructor(menuHandler: IntoCpsAppMenuHandler) {
        this.menuHandler = menuHandler;
    }

    initialize() {
        let self = this;
        this.browser = <HTMLDivElement>document.querySelector("#browser");
        let remote = require("electron").remote;

        this.tree = $(this.browser).w2sidebar({
            name: 'sidebar',
            menu: []
        });

        this.tree.on("expand", (event: JQueryEventObject) => {
            var item: ProjectBrowserItem = <ProjectBrowserItem>((<any>event).object);
            item.expand();
        });

        this.tree.on("collapse", (event: JQueryEventObject) => {
            var item: ProjectBrowserItem = <ProjectBrowserItem>((<any>event).object);
            item.collapse();
        });

        this.tree.on("contextMenu", (event: any) => {
            var item: ProjectBrowserItem = <ProjectBrowserItem>((<any>event).object);
            var menu: MenuEntry[] = item.menuEntries;
            this.tree.menu = menu;
        });

        this.tree.on("menuClick", (event: any) => {
            var entry: MenuEntry = <MenuEntry>((<any>event).menuItem);
            entry.callback(entry.item);
        });

        this.tree.on("dblClick", (event: JQueryEventObject) => {
            //Remove auto expansion on double click
            event.preventDefault();
            var item: ProjectBrowserItem = <ProjectBrowserItem>((<any>event).object);
            // Only mark the item as selected if it opens in the main window.
            if (item.opensInMainWindow) {
                this.tree.select(item.id);
            }
            item.dblClickHandler(item);
        });

        this.tree.on("click", (event: JQueryEventObject) => {
            let allowClick = true;
            if (this.menuHandler.deInitialize != null)
            { allowClick = this.menuHandler.deInitialize(); }
            if (allowClick) {
                var item: ProjectBrowserItem = <ProjectBrowserItem>((<any>event).object);
                item.clickHandler(item);
            }
        });

        this.refreshProjectBrowser();

        IntoCpsApp.getInstance().on(IntoCpsAppEvents.PROJECT_CHANGED, () => {
            this.refreshProjectBrowser();
        });
    }

    //set and refresh the prowser content
    private refreshProjectBrowser() {
        let app: IntoCpsApp = IntoCpsApp.getInstance();
        if (app.getActiveProject() != null) {
            if (this.rootItem)
                this.rootItem.deactivate();
            this.rootItem = this.addFSItem(app.getActiveProject().getRootFilePath(), null);
        }
    }

    public addFSItem(path: string, parent: ProjectBrowserItem): ProjectBrowserItem {
        var self = this;
        var result: ProjectBrowserItem = new ProjectBrowserItem(this, path, parent);
        var stat: any;

        try {
            stat = fs.statSync(path);
        } catch (e) {
            //unable to access path, this happens with emacs json plugin
            return;
        }
        var pathComponents = Utilities.relativeProjectPath(path).split(Path.sep);

        function menuEntry(text: string, icon: any, callback: (item: ProjectBrowserItem) => void = undefined) {
            return new MenuEntry(result, text, icon, callback);
        }

        var menuEntryDuplicate = menuEntry("Duplicate", 'glyphicon glyphicon-duplicate');
        var menuEntryDelete = menuEntry("Delete", 'glyphicon glyphicon-remove',
            function (item: ProjectBrowserItem) {
                console.info("Delete path: " + item.path);
                self.menuHandler.deletePath(item.path);
            });
        var menuEntryImport = menuEntry("Import", 'glyphicon glyphicon-import');
        var menuEntryExport = menuEntry("Export", 'glyphicon glyphicon-export');

        // Default menu entries
        result.menuEntries = [menuEntryDelete, menuEntryImport, menuEntryExport];

        if (Path.basename(path).startsWith('.')) {
            return null;
        }
        if (stat.isFile()) {
            if (pathComponents[0] == Project.PATH_TEST_DATA_GENERATION ||
                pathComponents[0] == Project.PATH_MODEL_CHECKING) {
                result.menuEntries = [];
                result.dblClickHandler = function () {
                    RTTester.openFileInGUI(path);
                }
                result.img = 'into-cps-icon-rtt-file';
                if (path.endsWith('.txt')) {
                    result.img = 'into-cps-icon-rtt-txt';
                }
                else if ([".conf", ".confinc", ".rtp", ".mbtconf"].some((e) => path.endsWith(e))) {
                    result.img = 'into-cps-icon-rtt-conf';
                }
                else if (path.endsWith('.log')) {
                    result.img = 'into-cps-icon-rtt-log';
                }
                else if (path.endsWith('.html')) {
                    result.img = 'into-cps-icon-rtt-html';
                }
            }
            else if (path.endsWith('.coe.json')) {
                //merge MultiModelConfig and folder
                parent.img = 'into-cps-icon-projbrowser-config';
                (<any>parent).coeConfig = path;
                parent.opensInMainWindow = true;
                parent.dblClickHandler = function (item: ProjectBrowserItem) {
                    self.menuHandler.openCoeView((<any>item).coeConfig);
                };
                parent.menuEntries = [menuEntryDuplicate, menuEntryDelete, menuEntryImport, menuEntryExport];
                return null;
            }
            else if (path.endsWith('.mm.json')) {
                //merge MultiModelConfig and folder
                parent.img = 'into-cps-icon-projbrowser-multimodel';
                (<any>parent).mmConfig = path;
                parent.opensInMainWindow = true;
                parent.dblClickHandler = function (item: ProjectBrowserItem) {
                    self.menuHandler.openMultiModel((<any>item).mmConfig);
                };
                var menuEntryCreateCoSim = menuEntry("Create Co-Simulation Configuration", 'glyphicon glyphicon-copyright-mark',
                    function (item: ProjectBrowserItem) {
                        console.info("Create new cosim config for: " + item.path);
                        self.menuHandler.createCoSimConfiguration(item.path);
                    });
                parent.menuEntries = [menuEntryDuplicate, menuEntryDelete, menuEntryCreateCoSim, menuEntryImport, menuEntryExport];
                return null;
            }
            else if (path.endsWith('.fmu')) {
                result.img = 'icon-page';
                result.opensInMainWindow = true;
                result.removeFileExtensionFromText();
                result.dblClickHandler = function (item: ProjectBrowserItem) {
                    self.menuHandler.openFmu(item.path);
                };
            }
            else if (path.endsWith('.sysml.json')) {
                result.img = 'into-cps-icon-projbrowser-modelio';
                result.removeFileExtensionFromText();
                result.opensInMainWindow = true;
                result.dblClickHandler = function (item: ProjectBrowserItem) {
                    self.menuHandler.openSysMlExport(item.path);
                };
                var menuEntryCreateMM = menuEntry("Create Multi-Model", 'glyphicon glyphicon-briefcase',
                    function (item: ProjectBrowserItem) {
                        console.info("Create new multimodel for: " + item.path);
                        self.menuHandler.createMultiModel(item.path);
                    });
                result.menuEntries = [menuEntryCreateMM, menuEntryDelete, menuEntryImport, menuEntryExport];
            }
            else if (path.endsWith('.emx')) {
                result.img = 'into-cps-icon-projbrowser-20sim';
                result.removeFileExtensionFromText();
                result.dblClickHandler = function (item: ProjectBrowserItem) {
                    self.menuHandler.openWithSystemEditor(item.path);
                };
            }
            else if (path.endsWith('.mo')) {
                result.img = 'into-cps-icon-projbrowser-openmodelica';
                result.removeFileExtensionFromText();
                result.dblClickHandler = function (item: ProjectBrowserItem) {
                    self.menuHandler.openWithSystemEditor(item.path);
                };
            }
            else if (path.endsWith('.csv')) {
                result.img = 'into-cps-icon-projbrowser-result';
                result.removeFileExtensionFromText();
                result.dblClickHandler = function (item: ProjectBrowserItem) {
                    self.menuHandler.openWithSystemEditor(item.path);
                };
            } else {
                return null;
            }
        } else if (stat.isDirectory()) {
            result.img = 'icon-folder';
            if (pathComponents[0] == Project.PATH_TEST_DATA_GENERATION ||
                pathComponents[0] == Project.PATH_MODEL_CHECKING) {
                result.menuEntries = [];
                if (pathComponents.length == 1) {
                    result.menuEntries.push(menuEntry("Start RT-Tester License Dongle", undefined,
                        function (item: ProjectBrowserItem) {
                            var cmd: any = {
                                title: "Start RT-Tester License Dongle",
                                command: RTTester.pythonExecutable(),
                                arguments: [Utilities.absoluteProjectPath(Path.join(pathComponents[0], "utils", "start_license.py"))],
                                background: true
                            }
                            cmd.title = "Start RT-Tester License Dongle";
                            self.menuHandler.runRTTesterCommand(cmd);
                        }));
                    result.menuEntries.push(menuEntry("Stop RT-Tester License Dongle", undefined,
                        function (item: ProjectBrowserItem) {
                            var cmd: any = {
                                title: "Stop RT-Tester License Dongle",
                                command: RTTester.pythonExecutable(),
                                arguments: [Utilities.absoluteProjectPath(Path.join(pathComponents[0], "utils", "stop_license.py"))]
                            }
                            cmd.title = "Stop RT-Tester License Dongle";
                            self.menuHandler.runRTTesterCommand(cmd);
                        }));
                    if (pathComponents[0] == Project.PATH_TEST_DATA_GENERATION) {
                        var menuEntryCreate = menuEntry("Create Test Data Generation Project", 'glyphicon glyphicon-asterisk',
                            function (item: ProjectBrowserItem) {
                                self.menuHandler.createTDGProject(item.path);
                            });
                        result.menuEntries.push(menuEntryCreate);
                    }
                    else if (pathComponents[0] == Project.PATH_MODEL_CHECKING) {
                        var menuEntryCreate = menuEntry("Create Model Checking Project", 'glyphicon glyphicon-asterisk',
                            function (item: ProjectBrowserItem) {
                                self.menuHandler.createMCProject(item.path);
                            });
                        result.menuEntries.push(menuEntryCreate);
                    }
                }
                if (pathComponents.length == 3 &&
                    (pathComponents[2] == "TestProcedures" || pathComponents[2] == "RTT_TestProcedures")) {
                    result.img = 'into-cps-icon-rtt-tla';
                }
                else if (pathComponents.length == 4 && pathComponents[2] == "TestProcedures") {
                    result.img = 'into-cps-icon-rtt-mbt-test-procedure';
                    if (pathComponents[3] == "Simulation") {
                        result.menuEntries.push(menuEntry("Generate Simulation FMU", 'into-cps-icon-rtt-mbt-generate',
                            function (item: ProjectBrowserItem) {
                                var cmd: any = RTTester.genericMBTPythonCommandSpec(path, "rtt-mbt-fmi2gen-sim.py");
                                cmd.title = "Generate Simulation FMU";
                                self.menuHandler.runRTTesterCommand(cmd);
                            }));
                    } else {
                        result.menuEntries.push(menuEntry("Solve", 'into-cps-icon-rtt-mbt-generate',
                            function (item: ProjectBrowserItem) {
                                var cmd: any = RTTester.genericMBTPythonCommandSpec(path, "rtt-mbt-gen.py");
                                cmd.title = "Solve";
                                self.menuHandler.runRTTesterCommand(cmd);
                            }));
                    }
                }
                else if (pathComponents.length == 4 && pathComponents[2] == "RTT_TestProcedures") {
                    result.img = 'into-cps-icon-rtt-test-procedure';
                    if (pathComponents[3] != "Simulation") {
                        result.menuEntries.push(menuEntry("Generate Test FMU", 'into-cps-icon-rtt-mbt-generate',
                            function (item: ProjectBrowserItem) {
                                var cmd: any = RTTester.genericMBTPythonCommandSpec(path, "rtt-mbt-fmi2gen.py");
                                cmd.title = "Generate Test FMU";
                                self.menuHandler.runRTTesterCommand(cmd);
                            }));
                        result.menuEntries.push(menuEntry("Run Test", 'into-cps-icon-rtt-run',
                            function (item: ProjectBrowserItem) {
                                self.menuHandler.runTest(item.path);
                            }));
                    }
                }
            }
            else if (this.isOvertureProject(path)) {
                result.img = 'into-cps-icon-projbrowser-overture';
                result.expanded = false;
            }
            else if (Path.basename(path) == Project.PATH_DSE) {
                var menuEntryCreate = menuEntry("Create Design Space Exploration Config", 'glyphicon glyphicon-asterisk',
                    function (item: ProjectBrowserItem) {
                        self.menuHandler.createDse(item.path);
                    });
                result.menuEntries = [menuEntryCreate];
            } else if (Path.basename(path) == "downloads") {
                //skip the project download folder
                return;
            }
            else if (Path.basename(path).indexOf("R_") == 0) {
                //result.img = 'into-cps-icon-projbrowser-result';
                result.menuEntries = [menuEntryDelete, menuEntryImport, menuEntryExport];
            }
        }
        if (result != null) {
            result.activate();
        }
        return result;
    }

    public addFSFolderContent(path: string, parent: ProjectBrowserItem = null): ProjectBrowserItem[] {
        var result: ProjectBrowserItem[] = [];
        var self = this;
        fs.readdirSync(path).forEach(function (name: string) {
            var filePath: string = Path.join(path, name);
            var ret = self.addFSItem(filePath, parent);
            if (ret != null) {
                result.push(ret);
            }
        });
        return result;
    }

    /*
    Utility function to determin if the container holds an Overture Project. TODO: Should this be annotated in the container instead.
     */
    private isOvertureProject(path: string): boolean {

        let projectFile = Path.normalize(Path.join(path, ".project"));

        try {
            if (!fs.accessSync(projectFile, fs.R_OK)) {
                let content = fs.readFileSync(projectFile, "UTF-8");
                return content.indexOf("org.overture.ide.vdmrt.core.nature") >= 0;

            }
        } catch (e) {

        }
        return false;
    }

}
