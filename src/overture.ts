
import { IntoCpsApp } from "./IntoCpsApp";

import * as fs from 'fs';
import * as Path from 'path';

import { SettingKeys } from "./settings/SettingKeys";
import * as child_process from "child_process";

export namespace Overture {

    export function exportOvertureFmu(type: string, path: string) {
        console.log("Exporting Overture FMU from path: " + path)
        let toolName = "overture-fmu-cli.jar";
        var jar = Path.join(IntoCpsApp.getInstance().getSettings().getValue(SettingKeys.INSTALL_DIR), toolName);
        if (!fs.existsSync(jar)) {
            jar = Path.join(IntoCpsApp.getInstance().getSettings().getValue(SettingKeys.INSTALL_TMP_DIR), toolName);
        }

        const { dialog } = require('electron').remote

        if (fs.existsSync(jar)) {
            var spawn = child_process.spawn;
            console.log(jar);


            var child = spawn('java', ['-jar', jar, "-export", type, "-name", Path.basename(path), "-output", IntoCpsApp.getInstance().getActiveProject().getFmusPath(), "-root", "."], {
                detached: true,
                shell: false,
                cwd: path
            });
            child.unref();
            child.stdout.on('data', function (data: any) {
                console.log(""+data);
            });


            var errorMessages = "";
            child.stderr.on('data', (data: any) => {
                console.log('stderr: ' + data);
                errorMessages += data;
                // dialog.showMessageBox({ type: 'error', buttons: ["OK"], message: "" + data }, function (button: any) { });
            });

            child.on('close', (code) => {
                if (errorMessages != "") {
                    dialog.showMessageBox({ type: 'error', buttons: ["OK"], message: errorMessages }, function (button: any) { });
                }

            })
        } else {
            dialog.showMessageBox({ type: 'error', buttons: ["OK"], message: "Please install: " + toolName + " first." }, function (button: any) { });
        }
    };


}