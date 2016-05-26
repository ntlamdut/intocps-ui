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

import {IntoCpsAppMenuHandler} from "../IntoCpsAppMenuHandler";
import {eventEmitter} from "../Emitter";

export class MenuEntry {
    id: string;
    text: string;
    icon: any;
    item: ProjectBrowserItem;
    callback: (item: ProjectBrowserItem) => void;
    constructor(item: ProjectBrowserItem, text: string, icon: any,
        callback: (item: ProjectBrowserItem) => void = undefined) {
        this.item = item;
        this.id = text;
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
    id: string;
    text: string;
    level: number;
    expanded: boolean = false;
    img: any = null;
    nodes: ProjectBrowserItem[] = [];
    parent: ProjectBrowserItem;
    group: boolean = false;

    clickHandler(): void { }
    dblClickHandler(): void { }
    menuEntries: MenuEntry[] = [];

    constructor(path: string, parent: ProjectBrowserItem) {
        this.id = path;
        this.text = Path.basename(path);
        this.parent = parent;
        if (parent == null) {
            this.level = 0;
            this.group = true;
            this.expanded = true;
        } else {
            this.level = parent.level + 1;
        }
    }
    removeFileExtensionFromText(): void {
        this.text = this.text.substr(0, this.text.indexOf('.'));
    }
    removeNodeWithPath(path: string): void {
        this.nodes = this.nodes.filter(function (n: ProjectBrowserItem) {
            return n.id != path;
        });
    }

}

export class BrowserController {
    private browser: HTMLDivElement;
    private tree: W2UI.W2Sidebar;

    private menuHandler: IntoCpsAppMenuHandler = null;

    constructor(menuHandler: IntoCpsAppMenuHandler) {
        this.menuHandler = menuHandler;
    }

    initialize() {
        let self = this;
        this.browser = <HTMLDivElement>document.querySelector("#browser");
        let remote = require("remote");

        this.tree = $(this.browser).w2sidebar({
            name: 'sidebar',
            menu: []
        });

        this.tree.on("contextMenu", (event: any) => {
            console.log(event);
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
            item.dblClickHandler();
        });

        this.tree.on("click", (event: JQueryEventObject) => {
            console.info(event);
            let allowClick = true;
            if (this.menuHandler.deInitialize != null)
            { allowClick = this.menuHandler.deInitialize(); }
            if (allowClick) {
                var item: ProjectBrowserItem = <ProjectBrowserItem>((<any>event).object);
                item.clickHandler();
            }
        });

        this.refreshProjectBrowser();

        var ipc = require('electron').ipcRenderer;
        ipc.on(IntoCpsAppEvents.PROJECT_CHANGED, (event, arg) => {
            this.refreshProjectBrowser();
        });

        eventEmitter.on(IntoCpsAppEvents.PROJECT_CHANGED, () => {
            this.refreshProjectBrowser();
        });
    }

    //set and refresh the prowser content
    private refreshProjectBrowser() {

        let app: IntoCpsApp = IntoCpsApp.getInstance();
        if (app.getActiveProject() != null) {
            this.clearAll();
            this.addToplevelNodes(this.addFSFolderContent(app.getActiveProject().getRootFilePath()));
        }
    }


    relativeProjectPath(path: string): string {
        if (!Path.isAbsolute(path)) {
            return Path.normalize(path);
        }
        let app: IntoCpsApp = IntoCpsApp.getInstance();
        var root: string = app.getActiveProject().getRootFilePath();
        return Path.relative(root, path);
    }


    relativePathIsInFolder(path: string, folder: string): boolean {
        var rPath = this.relativeProjectPath(path);
        var rFolder = this.relativeProjectPath(folder);
        var relative = Path.relative(rFolder, rPath);
        return rPath.endsWith(relative);
    }


    private addFSItem(path: string, parent: ProjectBrowserItem): ProjectBrowserItem {
        var self = this;
        var result: ProjectBrowserItem = new ProjectBrowserItem(path, parent);
        var stat = fs.statSync(path);

        function menuEntry(text: string, icon: any, callback: (item: ProjectBrowserItem) => void = undefined) {
            return new MenuEntry(result, text, icon, callback);
        }

        var menuEntryDuplicate = menuEntry("Duplicate", 'glyphicon glyphicon-duplicate');
        var menuEntryDelete = menuEntry("Delete", 'glyphicon glyphicon-remove');
        var menuEntryImport = menuEntry("Import", 'glyphicon glyphicon-import');
        var menuEntryExport = menuEntry("Export", 'glyphicon glyphicon-export');

        // Default menu entries
        result.menuEntries = [menuEntryDelete, menuEntryImport, menuEntryExport];

        if (Path.basename(path).startsWith('.')) {
            return null;
        }
        if (stat.isFile()) {
            if (path.endsWith('.coe.json')) {
                //merge MultiModelConfig and folder
                parent.img = 'glyphicon glyphicon-copyright-mark';
                (<any>parent).coeConfig = path;
                parent.dblClickHandler = function () {
                    self.menuHandler.openCoeView(path);
                };
                parent.menuEntries = [menuEntryDuplicate, menuEntryDelete, menuEntryImport, menuEntryExport];
                return null;
            }
            else if (path.endsWith('.mm.json')) {
                //merge MultiModelConfig and folder
                parent.img = 'glyphicon glyphicon-briefcase';
                (<any>parent).mmConfig = path;
                parent.dblClickHandler = function () {
                    self.menuHandler.openMultiModel(path);
                };
                var menuEntryCreateCoSim = menuEntry("Create Co-Simulation Configuration", 'glyphicon glyphicon-copyright-mark',
                    function (item: ProjectBrowserItem) {
                        console.info("Create new cosim config for: " + item.id);
                        self.menuHandler.createCoSimConfiguration(item.id);
                    });
                parent.menuEntries = [menuEntryDuplicate, menuEntryDelete, menuEntryCreateCoSim, menuEntryImport, menuEntryExport];
                return null;
            }
            else if (path.endsWith('.fmu')) {
                result.img = 'icon-page';
                result.removeFileExtensionFromText();
                result.dblClickHandler = function () {
                    self.menuHandler.openFmu(path);
                };
            }
            else if (path.endsWith('.sysml.json')) {
                result.img = 'glyphicon glyphicon-tasks';
                result.removeFileExtensionFromText();
                result.dblClickHandler = function () {
                    self.menuHandler.openSysMlExport(path);
                };
                var menuEntryCreateMM = menuEntry("Create Multi-Model", 'glyphicon glyphicon-briefcase',
                    function (item: ProjectBrowserItem) {
                        console.info("Create new multimodel for: " + item.id);
                        self.menuHandler.createMultiModel(item.id);
                    });
                result.menuEntries = [menuEntryCreateMM, menuEntryDelete, menuEntryImport, menuEntryExport];
            }
            else if (path.endsWith('.emx')) {
                result.img = 'glyphicon glyphicon-tree-conifer';
                result.removeFileExtensionFromText();
            }
            else if (path.endsWith('.mo')) {
                result.img = 'glyphicon glyphicon-tree-deciduous';
                result.removeFileExtensionFromText();
            }
            else if (path.endsWith('.csv')) {
                result.img = 'glyphicon glyphicon-th-list';
                result.removeFileExtensionFromText();
            } else {
                return null;
            }
        } else if (stat.isDirectory()) {
            result.img = 'icon-folder';
            if (this.isOvertureProject(path)) {
                result.img = 'glyphicon glyphicon-leaf';
                result.expanded = false;
            }
            else if (Path.basename(path) == Project.PATH_TEST_DATA_GENERATION) {
                var menuEntryCreate = menuEntry("Create Test Data Generation Project", 'glyphicon glyphicon-asterisk',
                    function (item: ProjectBrowserItem) {
                        self.menuHandler.createRTTesterProject(item.id);
                    });
                result.menuEntries = [menuEntryCreate];
            }
            else if (Path.basename(path) == Project.PATH_MODEL_CHECKING) {
                var menuEntryCreate = menuEntry("Create Model Checking Project", 'glyphicon glyphicon-asterisk',
                    function (item: ProjectBrowserItem) {
                        self.menuHandler.createRTTesterProject(item.id);
                    });
                result.menuEntries = [menuEntryCreate];
            }
            else if (Path.basename(path) == Project.PATH_DSE) {
                var menuEntryCreate = menuEntry("Create Design Space Exploration Config", 'glyphicon glyphicon-asterisk',
                    function (item: ProjectBrowserItem) {
                        self.menuHandler.createDse(item.id);
                    });
                result.menuEntries = [menuEntryCreate];
            }
            else if (name.indexOf("R_") == 0) {
                result.img = 'glyphicon glyphicon-barcode';
                var menuEntryDelete = menuEntry("Delete", 'glyphicon glyphicon-remove',
                    function (item: ProjectBrowserItem) {
                        console.info("Deleting " + event.target);
                        this.getCustomFs().removeRecursive(event.target, function (err: any, v: any) {
                            if (err != null) {
                                console.error(err);
                            }
                            self.refreshProjectBrowser();
                        });
                    });
                result.menuEntries = [menuEntryDelete, menuEntryImport, menuEntryExport];
            }
        }
        if (result != null) {
            if (parent != null) {
                parent.nodes.push(result);
            }
            if (stat.isDirectory()) {
                if (this.relativePathIsInFolder(path, <string>Project.PATH_SYSML) && result.level >= 2) {
                    // Skip: Limit directory depth in SysML folder to 2
                } else {
                    this.addFSFolderContent(path, result);
                }
            }
        }
        return result;
    }

    private addFSFolderContent(path: string, parent: ProjectBrowserItem = null): ProjectBrowserItem[] {
        var result: ProjectBrowserItem[] = [];
        var fs = require('fs');
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

    addToplevelNodes(nodes: Object | Object[]): Object {
        return this.tree.add(nodes);
    }

    addNodes(parentId: string, nodes: Object | Object[]): Object {
        return this.tree.add(parentId, nodes);
    }

    clearAll() {
        let ids: string[] = this.tree.nodes.map((value: any) => {
            return value.id
        });
        this.tree.remove.apply(this.tree, ids);
    }

    getSelectedId(): string {
        return this.tree.selected;
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

    private getCustomFs(): any {
        var fs = require('fs');
        fs.removeRecursive = function (path: string, cb: (err: any, v: any) => void) {
            var self = this;

            fs.stat(path, function (err: any, stats: any) {
                if (err) {
                    cb(err, stats);
                    return;
                }
                if (stats.isFile()) {
                    fs.unlink(path, function (err: any) {
                        if (err) {
                            cb(err, null);
                        } else {
                            cb(null, true);
                        }
                        return;
                    });
                } else if (stats.isDirectory()) {
                    // A folder may contain files
                    // We need to delete the files first
                    // When all are deleted we could delete the 
                    // dir itself
                    fs.readdir(path, function (err: any, files: any) {
                        if (err) {
                            cb(err, null);
                            return;
                        }
                        var f_length = files.length;
                        var f_delete_index = 0;

                        // Check and keep track of deleted files
                        // Delete the folder itself when the files are deleted

                        var checkStatus = function () {
                            // We check the status
                            // and count till we r done
                            if (f_length === f_delete_index) {
                                fs.rmdir(path, function (err: any) {
                                    if (err) {
                                        cb(err, null);
                                    } else {
                                        cb(null, true);
                                    }
                                });
                                return true;
                            }
                            return false;
                        };
                        if (!checkStatus()) {
                            for (var i = 0; i < f_length; i++) {
                                // Create a local scope for filePath
                                // Not really needed, but just good practice
                                // (as strings arn't passed by reference)
                                (function () {
                                    var filePath = path + '/' + files[i];
                                    // Add a named function as callback
                                    // just to enlighten debugging
                                    fs.removeRecursive(filePath, function removeRecursiveCB(err: any, status: any) {
                                        if (!err) {
                                            f_delete_index++;
                                            checkStatus();
                                        } else {
                                            cb(err, null);
                                            return;
                                        }
                                    });

                                })()
                            }
                        }
                    });
                }
            });
        };
        return fs;
    }

}
