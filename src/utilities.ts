
import Path = require('path');
import fs = require("fs");
import {IntoCpsApp} from  "./IntoCpsApp"


export class Utilities {
    public static timeStringToNumberConversion(text: string, setterFunc: (val: number) => void): boolean {
        let value = Number(text);
        if (isNaN(value)) {
            return false;
        }
        else {
            setterFunc(value);
            return true;
        }
    }

    public static projectRoot(): string {
        let app: IntoCpsApp = IntoCpsApp.getInstance();
        return app.getActiveProject().getRootFilePath();
    }

    public static getSystemArchitecture() {
        if (process.arch == "ia32") {
            return "32";
        } else if (process.arch == "x64") {
            return "64";
        } else {
            return process.arch;
        }
    }

    public static getSystemPlatform() {
        if (process.platform == "win32")
            return "windows";
        else
            return process.platform;
    }

    public static relativeProjectPath(path: string): string {
        if (!Path.isAbsolute(path)) {
            return Path.normalize(path);
        }
        var root: string = Utilities.projectRoot();
        return Path.relative(root, path);
    }

    public static absoluteProjectPath(path: string): string {
        if (Path.isAbsolute(path)) {
            return Path.resolve(path);
        }
        var root: string = Utilities.projectRoot();
        return Path.resolve(root, path);
    }

    public static pathIsInFolder(path: string, folder: string): boolean {
        var aPath: string[] = Utilities.absoluteProjectPath(path).split(Path.sep);
        var aFolder: string[] = Utilities.absoluteProjectPath(folder).split(Path.sep);
        var res: boolean = true;
        if (aPath.length < aFolder.length) {
            res = false;
        }
        for (var i = 0; i < aFolder.length; ++i) {
            if (aPath[i] != aFolder[i])
                res = false;
        }
        return res;
    }

    public static copyFile(source: string, target: string, callback: (error: string) => void) {
        // found at: http://stackoverflow.com/a/14387791
        let cbCalled = false;
        let error = false;
        let rd = fs.createReadStream(source);
        rd.on("error", report);
        let wr = fs.createWriteStream(target);
        wr.on("error", report);
        wr.on("close", () => { report(undefined); });
        rd.pipe(wr);
        function report(error: string) {
            if (!cbCalled) {
                callback(error);
                cbCalled = true;
            }
        }
    }


}
