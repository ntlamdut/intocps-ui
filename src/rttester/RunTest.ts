
import { ViewController } from "../iViewController";
import { IntoCpsApp } from "../IntoCpsApp";
import { RTTester } from "../rttester/RTTester";
import * as RTesterModalCommandWindow from "./GenericModalCommand";
import Path = require("path");
import { IntoCpsAppMenuHandler } from "../IntoCpsAppMenuHandler";

class FMUAssignment {
    assignments: FMUAssignments;
    hInstanceName: HTMLHeadingElement;
    hFMUPath: HTMLInputElement;
    hRemoveButton: HTMLButtonElement;
    html: HTMLDivElement;
    constructor(assignments: FMUAssignments, fmuFileName: string) {
        this.assignments = assignments;
        let self: FMUAssignment = this;
        $("<div>").load("./rttester/RunTest/SUTSelection.html", function (event: JQueryEventObject) {
            self.html = <HTMLDivElement>(this);
            self.hInstanceName = this.querySelector("#name");
            self.hFMUPath = this.querySelector("#fmuPath");
            self.hFMUPath.value = fmuFileName;
            self.hRemoveButton = this.querySelector("#removeButton");
            self.hRemoveButton.addEventListener("click", () => {
                self.assignments.remove(self);
            });
            let JSZip = require("jszip");
            var fs = require('fs');
            fs.readFile(fmuFileName, function (err: any, data: any) {
                if (err)
                    throw err;
                JSZip.loadAsync(data).then(function (zip: any) {
                    return zip.file("modelDescription.xml").async("text");
                }).then(function (xml: string) {
                    let parser = new DOMParser();
                    let dom = parser.parseFromString(xml, "text/xml");
                    self.hInstanceName.innerText = dom.documentElement.getAttribute("modelName");
                });
            });
            self.assignments.add(self);
        });
    }
    getHTML(): HTMLDivElement {
        return this.html;
    }
}

class FMUAssignments {
    controller: RunTestController;
    assignments: FMUAssignment[] = [];
    hSUTList: HTMLDivElement;
    hAddFMUButton: HTMLButtonElement;
    fmus: FMUAssignment[] = [];
    constructor(controller: RunTestController) {
        this.controller = controller;
        this.hSUTList = <HTMLDivElement>document.getElementById("sutList");
        this.hAddFMUButton = <HTMLButtonElement>document.getElementById("addFMUButton");
        this.hAddFMUButton.addEventListener("click", () => {
            let remote = require("electron").remote;
            let dialog = remote.dialog;
            let dialogResult: string[] = dialog.showOpenDialog({
                filters: [{ name: "FMU-Files", extensions: ["fmu"] }]
            });
            if (dialogResult != undefined) {
                let fmu = new FMUAssignment(this, dialogResult[0]);
            }
        });
    }
    add(fmu: FMUAssignment) {
        this.fmus.push(fmu);
        this.hSUTList.appendChild(fmu.getHTML());
    }
    remove(fmu: FMUAssignment) {
        this.hSUTList.removeChild(fmu.getHTML());
        let idx = this.fmus.indexOf(fmu);
        if (idx != -1) {
            this.fmus.splice(idx, 1);
        }
    }
}

export class RunTestController extends ViewController {

    menuHandler: IntoCpsAppMenuHandler;
    testCase: string;
    fmuAssignments: FMUAssignments = new FMUAssignments(this);
    hRunButton: HTMLButtonElement;
    hEnableSignalViewer: HTMLInputElement;
    hStepSize: HTMLInputElement;

    constructor(protected viewDiv: HTMLDivElement, menuHandler: IntoCpsAppMenuHandler, testCase: string) {
        super(viewDiv);
        this.menuHandler = menuHandler;
        let self = this;
        this.testCase = testCase;
        IntoCpsApp.setTopName("Run Test");
        this.hRunButton = <HTMLButtonElement>document.getElementById("runButton");
        this.hEnableSignalViewer = <HTMLInputElement>document.getElementById("enableSignalViewer");
        this.hStepSize = <HTMLInputElement>document.getElementById("stepSize");
        this.hRunButton.addEventListener("click", this.run.bind(self));
    };

    run() {
        if (this.hEnableSignalViewer.checked) {
            let script = Path.join(RTTester.rttInstallDir(), "bin", "rtt_live_sigplot.py");
            const spawn = require("child_process").spawn;
            const child = spawn(RTTester.pythonExecutable(),
                [script, "--line", "--corners", "--subplots", "--duplicates", "--keep-plotting"]);
        }
        let self = this;
        let python = RTTester.pythonExecutable();
        let rttTestContext = RTTester.getProjectOfFile(this.testCase);
        let runCOEScript = Path.join(RTTester.getUtilsPath(), "run-COE.py");
        let driverFMU = RTTester.getRelativePathInProject(this.testCase);
        let summaryPath = Path.join(this.testCase, "test-case-summary.html");
        let summaryTitle = RTTester.getRelativePathInProject(summaryPath);
        let cmd = {
            title: "Run Test",
            command: python,
            arguments: [
                runCOEScript,
                "--verbose",
                "--stepsize=" + this.hStepSize.value,
                "--timeout=auto",
                driverFMU],
            options: {
                env: RTTester.genericCommandEnv(this.testCase),
                cwd: rttTestContext
            },
            onSuccess: () => { self.menuHandler.openHTMLInMainView(summaryPath, summaryTitle) }
        };
        for (var fmuAssignment of this.fmuAssignments.assignments) {
            cmd.arguments.push(fmuAssignment.hFMUPath.value);
        }
        RTesterModalCommandWindow.runCommand(cmd);
    }

}

