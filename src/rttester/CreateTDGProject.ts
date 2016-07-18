
import {SourceDom} from "../sourceDom";
import {ViewController} from "../iViewController";
import {IntoCpsApp} from "../IntoCpsApp"
import * as Settings from  "../settings/settings"
import {SettingKeys} from "../settings/SettingKeys";
import Path = require('path');
import {RTTester} from "../rttester/RTTester";


export class CreateTDGProjectController extends ViewController {

    directory: string;

    constructor(protected viewDiv: HTMLDivElement, directory: string) {
        super(viewDiv);
        this.directory = directory;
        IntoCpsApp.setTopName("RT-Tester Project");
    };



    xmiModelBrowser() {
        let remote = require("electron").remote;
        let dialog = remote.dialog;
        let dialogResult: string[] = dialog.showOpenDialog({
            filters: [{ name: 'XMI-Files', extensions: ['xmi', 'xml'] }]
        });
        if (dialogResult != undefined) {
            var hText: HTMLInputElement = <HTMLInputElement>document.getElementById("XMIModelPathText");
            hText.value = dialogResult[0];
        }
    }

    createProject(): void {
        document.getElementById("CreationParameters").style.display = 'none';
        document.getElementById("Output").style.display = "block";
        var hPath: HTMLInputElement = <HTMLInputElement>document.getElementById("XMIModelPathText");
        var hOutputText: HTMLTextAreaElement = <HTMLTextAreaElement>document.getElementById("OutputText");
        let projectName = (<HTMLInputElement>document.getElementById("ProjectName")).value;
        let app: IntoCpsApp = IntoCpsApp.getInstance();
        var script: string = Path.join(RTTester.rttMBTInstallDir(), "bin/rtt-mbt-create-fmi2-project.py");
        let targetDir = Path.normalize(Path.join(this.directory, projectName));

        const spawn = require('child_process').spawn;
        var pythonPath = RTTester.pythonExecutable();
        let args: string[] = [
            script,
            "--dir=" + targetDir,
            "--skip-rttui",
            hPath.value
        ];
        var env: any = process.env;
        env["RTTDIR"] = RTTester.rttInstallDir();
        const p = spawn(pythonPath, args, { env: env });
        p.stdout.on('data', (data: string) => {
            hOutputText.textContent += data + "\n";
            hOutputText.scrollTop = hOutputText.scrollHeight;
        });
        p.stderr.on('data', (data: string) => {
            hOutputText.textContent += data + "\n";
            hOutputText.scrollTop = hOutputText.scrollHeight;
        });
        p.on('close', (code: number) => {
            document.getElementById("scriptRUN").style.display = "none";
            document.getElementById(code == 0 ? "scriptOK" : "scriptFAIL").style.display = "block";
        });
    }

}

