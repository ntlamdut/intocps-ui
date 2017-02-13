
import Path = require('path');
import * as fs from 'fs';
import {IntoCpsApp} from  "../IntoCpsApp";
import {Settings} from "../settings/settings";
import {SettingKeys} from "../settings/SettingKeys";
function launchProjectExplorer() {
    let remote = require("electron").remote;
    let dialog = remote.dialog;
    let settings = IntoCpsApp.getInstance().getSettings();
    let defaultPath = settings.getValue(SettingKeys.DEFAULT_PROJECTS_FOLDER_PATH);
    let dialogResult: string[] = dialog.showOpenDialog({defaultPath: defaultPath, properties: ["openDirectory"] });
    if (dialogResult != undefined) {

        var p: HTMLInputElement = <HTMLInputElement>document.getElementById("projectRootPathText");
        p.value = dialogResult[0];
        openProject();
    }


}

window.onload =function (){
    launchProjectExplorer() ;
};

function openProject() {
    let remote = require("electron").remote;
    let dialog = remote.dialog;

    var ipc = require('electron').ipcRenderer;
    console.log("Project open");

    var p: HTMLInputElement = <HTMLInputElement>document.getElementById("projectRootPathText");

    try {
        console.log(process.versions)
        let path =Path.join(p.value, ".project.json");
        if (fs.accessSync(path, fs.constants.R_OK)) {
            dialog.showErrorBox("Cannot open project", "Unable to find project at path: " + path);
        }
        IntoCpsApp.getInstance().emit('open-project-open', { path: path });
    } catch (e) {
        dialog.showErrorBox("Cannot open project", "Unable to find project at path: " + p.value + " Error: " + e);
    }


}

