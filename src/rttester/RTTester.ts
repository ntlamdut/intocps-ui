///<reference path="../../typings/browser/ambient/github-electron/index.d.ts"/>
///<reference path="../../typings/browser/ambient/node/index.d.ts"/>

import {IntoCpsApp} from  "../IntoCpsApp"
import Path = require('path');
import {SettingKeys} from "../settings/SettingKeys";
import {Utilities} from "../utilities";

export class RTTester {

    public static getProjectOfFile(path: string) {
        var relPath = Utilities.relativeProjectPath(path);
        var pathComp = relPath.split(Path.sep);
        var root = Utilities.projectRoot();
        return Path.resolve(Path.join(root, pathComp[0], pathComp[1]));
    }

    public static getRelativePathInProject(path: string) {
        var relPath = Utilities.relativeProjectPath(path);
        var pathComp = relPath.split(Path.sep);
        return pathComp.splice(2).join(Path.sep);
    }

    public static openFileInGUI(path: string) {
        let app: IntoCpsApp = IntoCpsApp.getInstance();
        let settings = app.getSettings();
        let rttui = Path.normalize(<string>settings.getSetting(SettingKeys.RTTESTER_RTTUI));
        let projectToOpen = RTTester.getProjectOfFile(path);
        let fileToOpen = RTTester.getRelativePathInProject(path);
        const spawn = require('child_process').spawn;
        let args: string[] = ["--open-file", fileToOpen, projectToOpen];
        console.log("Spawn \"" + rttui + "\" with options [" + args + "].");
        const process = spawn(rttui, args, { detached: true, stdio: ['ignore'] });
        process.unref();
    }

}
