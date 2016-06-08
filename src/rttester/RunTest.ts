
import {SourceDom} from "../sourceDom";
import {IViewController} from "../iViewController";
import {IntoCpsApp} from "../IntoCpsApp"
import * as Settings from  "../settings/settings"
import {SettingKeys} from "../settings/SettingKeys";
import Path = require('path');
import {RTTester} from "../rttester/RTTester";

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
        var self: FMUAssignment = this;
        $('<div>').load("./rttester/RunTest/SUTSelection.html", function (event: JQueryEventObject) {
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
                    filters: [{ name: 'FMU-Files', extensions: ['fmu'] }]
                });
                if (dialogResult != undefined) {
                    self.hFMUPath.value = dialogResult[0];
                }
                self.updateSimulationButton();
            });
            self.hInstanceName.innerText = self.componentName + " - " + self.instanceName;
            self.hFMUPath.value = fmuFileName != null ? fmuFileName : self.simulationFMUPath;
            self.assignments.hSUTList.appendChild(this);
            self.updateSimulationButton();
        });
    }
    updateSimulationButton() {
        console.log("change");
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
        // Mockup data
        this.assignments.push(new FMUAssignment(this, "TurnIndicationController", "x1", null));
        this.assignments.push(new FMUAssignment(this, "Component 2", "x2", "c:\\file2.fmu"));
        this.assignments.push(new FMUAssignment(this, "Component 3", "x3", "c:\\file5.fmu"));
    }
}

export class RunTestController extends IViewController {

    testCase: string;
    fmuAssignments: FMUAssignments = new FMUAssignments(this);

    constructor(protected viewDiv: HTMLDivElement, testCase: string) {
        super(viewDiv);
        this.testCase = testCase;
        IntoCpsApp.setTopName("Run Test");
        this.fmuAssignments.load();
    };

}

