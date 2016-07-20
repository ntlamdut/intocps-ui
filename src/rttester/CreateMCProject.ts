
import {ViewController} from "../iViewController";
import {IntoCpsApp} from "../IntoCpsApp";
import Path = require("path");
import {RTTester} from "../rttester/RTTester";
import {CTAbstractionsView} from "./CTAbstractions";


export class CreateMCProjectController extends ViewController {

    directory: string;
    hPath: HTMLInputElement;


    constructor(protected viewDiv: HTMLDivElement, directory: string) {
        super(viewDiv);
        this.directory = directory;
        IntoCpsApp.setTopName("RT-Tester Project");
        this.hPath = <HTMLInputElement>document.getElementById("XMIModelPathText");
    };


    xmiModelBrowser() {
        let remote = require("electron").remote;
        let dialog = remote.dialog;
        let dialogResult: string[] = dialog.showOpenDialog({
            filters: [{ name: "XMI-Files", extensions: ["xmi", "xml"] }]
        });
        if (dialogResult != undefined) {
            let hText: HTMLInputElement = <HTMLInputElement>document.getElementById("XMIModelPathText");
            hText.value = dialogResult[0];
        }
    }


    loadXMIFile() {
        document.getElementById("settings").style.display = "block";
        new CTAbstractionsView(<HTMLDivElement>document.getElementById("AbstractionsTreeDiv"),
            this.hPath.value);
    }

    createMBTProject() {
        document.getElementById("CreationParameters").style.display = "none";
        document.getElementById("Output").style.display = "block";
        let hOutputText: HTMLTextAreaElement = <HTMLTextAreaElement>document.getElementById("OutputText");
        let projectName = (<HTMLInputElement>document.getElementById("ProjectName")).value;
        let script: string = Path.join(RTTester.rttMBTInstallDir(), "bin/rtt-mbt-create-fmi2-project.py");
        let targetDir = Path.normalize(Path.join(this.directory, projectName));

        const spawn = require("child_process").spawn;
        let pythonPath = RTTester.pythonExecutable();
        let args: string[] = [
            script,
            "--dir=" + Path.join(targetDir, "mbt"),
            "--skip-tests",
            "--skip-configure",
            "--skip-rttui",
            this.hPath.value
        ];
        let env: any = process.env;
        env["RTTDIR"] = RTTester.rttInstallDir();
        const p = spawn(pythonPath, args, { env: env });
        p.stdout.on("data", (data: string) => {
            hOutputText.textContent += data + "\n";
            hOutputText.scrollTop = hOutputText.scrollHeight;
        });
        p.stderr.on("data", (data: string) => {
            hOutputText.textContent += data + "\n";
            hOutputText.scrollTop = hOutputText.scrollHeight;
        });
        p.on("close", (code: number) => {
            document.getElementById("scriptRUN").style.display = "none";
            document.getElementById(code == 0 ? "scriptOK" : "scriptFAIL").style.display = "block";
        });
    }

    createProject(): void {
        this.createMBTProject();
    }

}

