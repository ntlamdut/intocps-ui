
import fs = require("fs");
import Path = require("path");
import {RTTester} from "../rttester/RTTester";


export function display(templateTP: string): void {
    let hModalTitle: HTMLHeadingElement = <HTMLHeadingElement>document.getElementById("modalTitle");
    let hCopyButton: HTMLButtonElement = <HTMLButtonElement>document.getElementById("modalCopy");
    let hTPName: HTMLInputElement = <HTMLInputElement>document.getElementById("TPName");
    let hModalFail: HTMLLabelElement = <HTMLLabelElement>document.getElementById("modalFail");

    let oldTP = RTTester.getRelativePathInProject(templateTP);
    let oldTPName = oldTP.split(Path.sep)[1];
    let prjDir = RTTester.getProjectOfFile(templateTP);
    hModalTitle.innerText = "Copy Test Procedure \"" + oldTPName + "\"";

    hTPName.addEventListener("input", () => {
        if (hTPName.value == "") {
            hModalFail.innerText = "";
            hModalFail.style.display = "none";
            hCopyButton.disabled = true;
        } else {
            let path = Path.join(prjDir, "TestProcedures", hTPName.value);
            fs.stat(path, (err: any, stats: fs.Stats) => {
                if (!err) {
                    hModalFail.innerText = "Invalid name for Test Procedure.";
                    hCopyButton.disabled = true;
                    hModalFail.style.display = "block";
                } else {
                    hModalFail.innerText = "";
                    hCopyButton.disabled = false;
                    hModalFail.style.display = "none";
                }
            });
        }
    });
    let copy = () => {
        let newTP = Path.join("TestProcedures", hTPName.value);
        let script = Path.join(RTTester.rttMBTInstallDir(), "bin", "rtt-mbt-copy-test.py");
        const spawn = require("child_process").spawn;
        let args: string[] = [
            script,
            oldTP,
            newTP
        ];
        let env: any = RTTester.genericCommandEnv(templateTP);
        const p = spawn(RTTester.pythonExecutable(), args, { env: env });
        p.stdout.on("data", (d: any) => console.log(d.toString()));
        p.stderr.on("data", (d: any) => console.log(d.toString()));
        (<any>$("#modalDialog")).modal("hide");
    };
    hCopyButton.addEventListener("click", (event: Event)=> copy());
    hTPName.addEventListener("keydown", (e) => {
        // enter key
        if (e.keyCode == 13 && !hCopyButton.disabled) {
            copy();
        }
    });
}

