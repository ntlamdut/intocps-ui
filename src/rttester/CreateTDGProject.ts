
import {ViewController} from "../iViewController";
import {IntoCpsApp} from "../IntoCpsApp";
import Path = require("path");
import {RTTester} from "../rttester/RTTester";
import * as RTesterModalCommandWindow from "./GenericModalCommand";
import {IntoCpsAppMenuHandler} from "../IntoCpsAppMenuHandler";


export class CreateTDGProjectController extends ViewController {

    menuHandler: IntoCpsAppMenuHandler;
    directory: string;

    constructor(protected viewDiv: HTMLDivElement, menuHandler: IntoCpsAppMenuHandler, directory: string) {
        super(viewDiv);
        this.menuHandler = menuHandler;
        this.directory = directory;
        IntoCpsApp.setTopName("RT-Tester Project");
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

    createProject(): void {
        let self = this;
        let xmiPath = (<HTMLInputElement>document.getElementById("XMIModelPathText")).value;
        let projectName = (<HTMLInputElement>document.getElementById("ProjectName")).value;
        let script = Path.join(RTTester.rttMBTInstallDir(), "bin", "rtt-mbt-create-fmi2-project.py");
        let targetDir = Path.normalize(Path.join(self.directory, projectName));
        let env: any = process.env;
        let modelDetailsPath = Path.join(targetDir, "model", "model-details.html");
        let modelDetailsTitle = RTTester.getRelativePathInProject(modelDetailsPath);
        env["RTTDIR"] = RTTester.rttInstallDir();
        let cmd = {
            title: "Create Test Automation Project",
            command: RTTester.pythonExecutable(),
            arguments: [
                script,
                "--dir=" + targetDir,
                "--skip-rttui",
                xmiPath
            ],
            options: { env: env },
            onSuccess: () => { self.menuHandler.openHTMLInMainView(modelDetailsPath, modelDetailsTitle) }
        };
        RTesterModalCommandWindow.runCommand(cmd);
    }

}

