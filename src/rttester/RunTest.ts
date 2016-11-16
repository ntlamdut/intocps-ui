
import { ViewController } from "../iViewController";
import { IntoCpsApp } from "../IntoCpsApp";
import { RTTester } from "../rttester/RTTester";
import * as RTesterModalCommandWindow from "./GenericModalCommand";
import Path = require("path");
import {IntoCpsAppMenuHandler} from "../IntoCpsAppMenuHandler";


class FMUAssignment {
    assignments: FMUAssignments;
    instanceName: string;
    componentName: string;
    simulationFMUPath: string;
    hInstanceName: HTMLHeadingElement;
    hFMUPath: HTMLInputElement;
    hBrowseButton: HTMLButtonElement;
    hSimulationButton: HTMLButtonElement;
    html: HTMLElement;
    constructor(assignments: FMUAssignments, componentName: string, instanceName: string, fmuFileName: string = null) {
        this.componentName = componentName;
        this.assignments = assignments;
        this.instanceName = instanceName;
        this.simulationFMUPath = RTTester.simulationFMU(this.assignments.controller.testCase, this.componentName);
        let self: FMUAssignment = this;
        $("<div>").load("./rttester/RunTest/SUTSelection.html", function (event: JQueryEventObject) {
            self.hInstanceName = this.querySelector("#instanceName");
            self.hFMUPath = this.querySelector("#fmuPath");
            self.hBrowseButton = this.querySelector("#browseButton");
            self.hSimulationButton = this.querySelector("#simulationButton");
            self.hSimulationButton.addEventListener("click", () => self.setSimulation());
            self.hFMUPath.addEventListener("input", () => { self.updateSimulationButton(); });
            self.hBrowseButton.addEventListener("click", () => {
                let remote = require("electron").remote;
                let dialog = remote.dialog;
                let dialogResult: string[] = dialog.showOpenDialog({
                    filters: [{ name: "FMU-Files", extensions: ["fmu"] }]
                });
                if (dialogResult != undefined) {
                    self.hFMUPath.value = dialogResult[0];
                }
                self.updateSimulationButton();
            });
            self.hInstanceName.innerText = self.componentName; // + " - " + self.instanceName;
            self.hFMUPath.value = fmuFileName != null ? fmuFileName : self.simulationFMUPath;
            self.assignments.hSUTList.appendChild(this);
            self.updateSimulationButton();
        });
    }
    updateSimulationButton() {
        this.hSimulationButton.className = (this.hFMUPath.value == this.simulationFMUPath) ?
            "btn btn-info btn-sm" : "btn btn-default btn-sm";
    }
    setSimulation() {
        this.hFMUPath.value = this.simulationFMUPath;
        this.updateSimulationButton();
    }
}

class FMUAssignments {
    controller: RunTestController;
    assignments: FMUAssignment[] = [];
    hSUTList: HTMLDivElement;
    constructor(controller: RunTestController) {
        this.controller = controller;
        this.hSUTList = <HTMLDivElement>document.getElementById("sutList");
    }
    load() {
        this.assignments.push(new FMUAssignment(this, "INTO-CPS-Demo", "", null));
    }
}

export class RunTestController extends ViewController {

    menuHandler: IntoCpsAppMenuHandler;
    testCase: string;
    fmuAssignments: FMUAssignments = new FMUAssignments(this);
    hRunButton: HTMLButtonElement;
    hStepSize: HTMLInputElement;

    constructor(protected viewDiv: HTMLDivElement, menuHandler: IntoCpsAppMenuHandler, testCase: string) {
        super(viewDiv);
        this.menuHandler = menuHandler;
        let self = this;
        this.testCase = testCase;
        IntoCpsApp.setTopName("Run Test");
        this.fmuAssignments.load();
        this.hRunButton = <HTMLButtonElement>document.getElementById("runButton");
        this.hStepSize = <HTMLInputElement>document.getElementById("stepSize");
        this.hRunButton.addEventListener("click", this.run.bind(self));
    };

    run() {
        let self = this;
        let python = RTTester.pythonExecutable();
        let rttTestContext = RTTester.getProjectOfFile(this.testCase);
        let runCOEScript = Path.normalize(Path.join(
            rttTestContext, "..", "utils", "run-COE.py"));
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

