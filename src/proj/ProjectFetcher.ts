///<reference path="../../typings/browser/ambient/github-electron/index.d.ts"/>
///<reference path="../../typings/browser/ambient/node/index.d.ts"/>
///<reference path="../../typings/browser/ambient/jquery/index.d.ts"/>
/// <reference path="../../node_modules/typescript/lib/lib.es6.d.ts" />

import {IntoCpsApp} from  "../IntoCpsApp"
import {SettingKeys} from "../settings/SettingKeys";


import Path = require('path');
import fs = require('fs');

/*window.onload = function () {
    
};*/

function launchProjectExplorer() {
    let remote = require("electron").remote;
    let dialog = remote.require("dialog");
    let dialogResult: string[] = dialog.showOpenDialog({ properties: ["openDirectory", "createDirectory"] });
    if (dialogResult != undefined) {

        var p: HTMLInputElement = <HTMLInputElement>document.getElementById("projectRootPathText");
        p.value = dialogResult[0];
        //       this.app.createProject("my project",this.projectRootPath.value);
    }


}




function open() {

    var p: HTMLInputElement = <HTMLInputElement>document.getElementById("basic-url");
    var dest: HTMLInputElement = <HTMLInputElement>document.getElementById("projectRootPathText");
    fetchProjectThroughGit(p.value, dest.value);
}

export function fetchProjectThroughGit(url: string, targetFolder: string) {
    var spawn = require('child_process').spawn;

    let childCwd = targetFolder;

    var name = url.substring(url.lastIndexOf('/') + 1);

    let index = name.lastIndexOf('.git');
    if (index > 0) {
        name = name.substring(0, index);
    }

    let repoPath = Path.join(childCwd, name);
    let repoProjectFile = Path.join(repoPath, ".project.json");

    var repoExists = false;
    try {
        fs.accessSync(repoProjectFile, fs.R_OK);
        repoExists = true;

    } catch (e) {

    }

    var mkdirp = require('mkdirp');
    mkdirp.sync(childCwd);

    var child: any = null;

    if (!repoExists) {
        child = spawn('git', ['clone', url], {
            detached: false,
            shell: true,
            cwd: childCwd
        });
    } else {
        child = spawn('git', ['pull'], {
            detached: false,
            shell: true,
            cwd: repoPath
        });
    }
    child.unref();


    child.stdout.on('data', function (data: any) {
        console.log('stdout: ' + data);
        //Here is where the output goes

    });
    child.stderr.on('error', function (data: any) {
        console.error('stderr: ' + data);

    });
    child.on('close', function (code: any) {
        console.log('closing code: ' + code);
        //Here you can get the exit code of the script
    });

    child.on('exit', function (code: any) {
        console.log('exit code: ' + code);
        //Here you can get the exit code of the script


        let p = IntoCpsApp.getInstance().loadProject(repoProjectFile);
        IntoCpsApp.getInstance().setActiveProject(p);
    });
    //    var fork = require("child_process").fork,
    //   child = fork(__dirname + "/start-coe.js");

}