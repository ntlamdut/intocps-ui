
import {SourceDom} from "../sourceDom";
import {IViewController} from "../iViewController";
import {IntoCpsApp} from "../IntoCpsApp"
import * as Settings from  "../settings/settings"
import {SettingKeys} from "../settings/SettingKeys";
import Path = require('path');
import {RTTester} from "../rttester/RTTester";

class FMUAssignment {
    controller: RunTestController;
    instanceName: string;
    fmuFileName: string;
    componentName: string;
    hInstanceName: HTMLHeadingElement;
    hFMUPath: HTMLInputElement;
    hBrowseButton: HTMLButtonElement;
    hSimulationButton: HTMLButtonElement;
    constructor(controller: RunTestController, componentName: string, instanceName: string, fmuFileName: string) {
        this.componentName = componentName;
        this.controller = controller;
        this.instanceName = instanceName;
        this.fmuFileName = fmuFileName;
    }
    insertToHTMLList(list: HTMLDivElement) {
        var self: FMUAssignment = this;
        $('<div>').load("./rttester/RunTest/SUTSelection.html", function (event: JQueryEventObject) {
            self.hInstanceName = this.querySelector("#instanceName");
            self.hFMUPath = this.querySelector("#fmuPath");
            self.hBrowseButton = this.querySelector("#browseButton");
            self.hSimulationButton = this.querySelector("#simulationButton");
            self.hSimulationButton.addEventListener("click", () => self.setSimulation());
            self.hBrowseButton.addEventListener("click", () => {
                let remote = require("remote");
                let dialog = remote.require("dialog");
                let dialogResult: string[] = dialog.showOpenDialog({
                    filters: [{ name: 'FMU-Files', extensions: ['fmu'] }]
                });
                if (dialogResult != undefined) {
                    self.hFMUPath.value = dialogResult[0];
                }
            });
            self.display();
            list.appendChild(this);
        });
    }
    setSimulation() {
        this.fmuFileName = null;
        this.display();
    }
    display() {
        this.hInstanceName.innerText = this.componentName + " - " + this.instanceName;
        if (this.fmuFileName == null) {
            this.hFMUPath.value = RTTester.simulationFMU(this.controller.testCase, this.componentName);
        } else {
            this.hFMUPath.value = this.fmuFileName;
        }
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
        this.assignments.push(new FMUAssignment(this.controller, "TurnIndicationController", "x1", null));
        this.assignments.push(new FMUAssignment(this.controller, "Component 2", "x2", "c:\\file2.fmu"));
        this.assignments.push(new FMUAssignment(this.controller, "Component 3", "x3", "c:\\file5.fmu"));
        this.display();
    }
    display() {
        var self: FMUAssignments = this;
        while (this.hSUTList.firstChild)
            this.hSUTList.removeChild(this.hSUTList.firstChild);
        this.assignments.forEach((a) =>
            a.insertToHTMLList(this.hSUTList));
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

