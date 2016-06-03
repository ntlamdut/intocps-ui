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

    public static simulationFMU(testCase: string, component: string) {
        return Path.join(RTTester.getProjectOfFile(testCase),
            "RTT_TestProcedures", "Simulation", component + "_simulation.fmu");
    }

    public static genericCommandEnv(path: string) {
        var env: any = process.env;
        env["RTT_TESTCONTEXT"] = RTTester.getProjectOfFile(path);
        env["RTTDIR"] = RTTester.rttInstallDir();
        return env;
    }

    public static openFileInGUI(path: string) {
        let app: IntoCpsApp = IntoCpsApp.getInstance();
        let settings = app.getSettings();
        let rttui = Path.normalize(<string>settings.getSetting(SettingKeys.RTTESTER_RTTUI));
        let projectToOpen = RTTester.getProjectOfFile(path);
        let fileToOpen = RTTester.getRelativePathInProject(path);
        let args: string[] = ["--open-file", fileToOpen, projectToOpen];
        let options: any = {
            env: RTTester.genericCommandEnv(path),
            cwd: Path.dirname(rttui)
        };
        console.log("Spawn \"" + rttui + "\" with options [" + args + "].");
        const spawn = require('child_process').spawn;
        const process = spawn(rttui, args, { detached: true, stdio: ['ignore'] });
        process.unref();
    }

    public static pythonExecutable(): string {
        let app: IntoCpsApp = IntoCpsApp.getInstance();
        let settings = app.getSettings();
        return Path.normalize(settings.getSetting(SettingKeys.RTTESTER_PYTHON));
    }

    public static rttInstallDir(): string {
        let app: IntoCpsApp = IntoCpsApp.getInstance();
        let settings = app.getSettings();
        return Path.normalize(settings.getSetting(SettingKeys.RTTESTER_INSTALL_DIR));
    }

    public static rttMBTInstallDir(): string {
        let app: IntoCpsApp = IntoCpsApp.getInstance();
        let settings = app.getSettings();
        return Path.normalize(settings.getSetting(SettingKeys.RTTESTER_MBT_INSTALL_DIR));
    }

    public static genericMBTPythonCommandSpec(path: string, command: string): any {
        var script = Path.normalize(Path.join(RTTester.rttMBTInstallDir(), "bin", command));
        var tp = RTTester.getRelativePathInProject(path);
        return {
            command: RTTester.pythonExecutable(),
            arguments: [script, tp],
            options: { env: RTTester.genericCommandEnv(path) }
        }
    }

}
