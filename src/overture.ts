
import { IntoCpsApp } from "./IntoCpsApp";

import * as fs from 'fs';
import * as Path from 'path';

import { SettingKeys } from "./settings/SettingKeys";
import * as child_process from "child_process";

export namespace Overture {

    function processStdOutData(data: any, div: HTMLDivElement, isErrorStream: boolean = false) {
        let dd = (data + "").split("\n");

        dd.forEach(line => {
            if (line.trim().length != 0) {
                let m = <HTMLSpanElement>document.createElement("span");
                m.innerHTML = line + "<br/>";
                if (isErrorStream)
                    m.style.color = "rgb(255, 0, 0)";

                div.appendChild(m);
                m.scrollIntoView();
            }
        });
    }

    export function exportOvertureFmu(type: string, path: string) {
        const { dialog } = require('electron').remote
        console.log("Exporting Overture FMU from path: " + path)
        let toolName = "overture-fmu-cli.jar";
        var jar = Path.join(IntoCpsApp.getInstance().getSettings().getValue(SettingKeys.INSTALL_DIR), toolName);
        if (!fs.existsSync(jar)) {
            jar = Path.join(IntoCpsApp.getInstance().getSettings().getValue(SettingKeys.INSTALL_TMP_DIR), toolName);
        }
        if (fs.existsSync(jar)) {
            w2popup.load({
                showClose       : true,
                title: 'Overture FMU Export',
                url: 'overture.html', onOpen: function () {
                    console.log('opened');
                    let div = <HTMLDivElement>document.getElementById("hgfgfhg");
                    var spawn = child_process.spawn;
                    console.log(jar);

                    var child = spawn('java', ['-jar', jar, "-v", "-export", type, "-name", Path.basename(path), "-output", IntoCpsApp.getInstance().getActiveProject().getFmusPath(), "-root", "."], {
                        detached: true,
                        shell: false,
                        cwd: path
                    });
                    child.unref();
                    child.stdout.on('data', function (data: any) {
                        console.log("" + data);
                        processStdOutData(data, div);

                    });

                    var errorMessages = "FMU Export Failed with Following Errors:\n";

                    child.stderr.on('data', (data: any) => {
                        console.log('stderr: ' + data);
                        errorMessages += data;
                        processStdOutData(data, div, true);
                    });

                    child.on('close', (code) => {
                        if (code != 0) {
                            processStdOutData("Export Failed.", div, true);
                            //                            dialog.showMessageBox({ type: 'error', buttons: ["OK"], message: errorMessages }, function (button: any) { });
                        } else {
                            processStdOutData("FMU Export Complete: " + Path.basename(path) + ".fmu", div, false);
                        }
                    })
                }

            }); // content loaded from the server
        } else {
            dialog.showMessageBox({ type: 'error', buttons: ["OK"], message: "Please install: " + "Overture FMU Import / Exporter CLI - Overture FMI Support" + " first." }, function (button: any) { });
        }
    };


}