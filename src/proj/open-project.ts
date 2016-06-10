
import Path = require('path');
import fs = require('fs');
import {IntoCpsApp} from  "../IntoCpsApp";

function launchProjectExplorer() {
    let remote = require("electron").remote;
    let dialog = remote.dialog;
    let dialogResult: string[] = dialog.showOpenDialog({ properties: ["openDirectory"] });
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

    var fs = require("fs");
    try {
        let path =Path.join(p.value, ".project.json");
        if (fs.accessSync(path, fs.R_OK)) {
            dialog.showErrorBox("Cannot open project", "Unable to find project at path: " + path);
        }
        IntoCpsApp.getInstance().emit('open-project-open', { path: path });
    } catch (e) {
        dialog.showErrorBox("Cannot open project", "Unable to find project at path: " + p.value + " Error: " + e);
    }


}

