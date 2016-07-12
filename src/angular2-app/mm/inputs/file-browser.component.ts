import {Component, Input, Output, EventEmitter, OnInit} from "@angular/core";
import {remote} from "electron";
import * as Path from "path";

@Component({
    selector: "file-browser",
    templateUrl: "./angular2-app/mm/inputs/file-browser.component.html"
})
export class FileBrowserComponent implements OnInit {
    @Input()
    basePath = "";

    @Input()
    set path(path:string) {
        this._path = path.replace(Path.normalize(`${this.basePath}/`), "");
    }
    get path():string {
        return this._path;
    }

    @Output()
    pathChange = new EventEmitter<string>();

    private _path:string = "";
    private dialog:Electron.Dialog;
    private platform:string;

    ngOnInit():any {
        this.dialog = remote.dialog;
        this.platform = remote.getGlobal("intoCpsApp").platform;
    }

    browseFile() {
        this.browse(["openFile"]);
    }

    browseDirectory() {
        this.browse(["openDirectory"]);
    }

    browse(properties: ('openFile' | 'openDirectory' | 'multiSelections' | 'createDirectory')[] = ["openFile", "openDirectory"]) {
        let dialogResult: string[] = this.dialog.showOpenDialog({defaultPath: this.basePath,  properties: properties });

        if (dialogResult) this.onChange(dialogResult[0]);
    }

    onChange(path:string) {
        this.path = path;
        this.pathChange.emit(this.path);
    }
}