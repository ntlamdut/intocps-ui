
import {SourceDom} from "../sourceDom";
import {IViewController} from "../iViewController";
import {IntoCpsApp} from "../IntoCpsApp"
import * as Settings from  "../settings/settings"
import {SettingKeys} from "../settings/SettingKeys";
import Path = require('path');
import {RTTester} from "../rttester/RTTester";


class Abstraction {
    hAbstractionLink: HTMLLinkElement;
    hAbstractionPanel: HTMLDivElement;
    output: Output;
    htmlFile: string;
    constructor(output: Output, htmlFile: string) {
        this.output = output;
        this.htmlFile = htmlFile;
    }
    setActive(active: boolean) {
        if (!active) {
            this.hAbstractionLink.classList.remove("active");
            this.hAbstractionLink.classList.remove("aria-expanded");
        } else {
            this.hAbstractionLink.classList.add("active");
            this.hAbstractionLink.classList.add("aria-expanded");
        }
    }
    display(hAbstractionDiv: HTMLDivElement, activate: boolean) {
        let self: Abstraction = this;
        $('<div>').load(self.htmlFile, function (event: JQueryEventObject) {
            let idBase: string = Path.basename(self.htmlFile, ".html");
            self.hAbstractionLink = <HTMLLinkElement>this.querySelector("#heading" + idBase);
            self.hAbstractionPanel = <HTMLDivElement>this.querySelector("#collapse" + idBase);
            self.hAbstractionLink.addEventListener("click", function () { self.output.selectAbstraction(self); });
            if (activate)
                self.output.selectAbstraction(self);
            hAbstractionDiv.appendChild(self.hAbstractionLink);
        });
    }
}


class Output {
    component: Component;
    name: string;
    hOutput: HTMLLinkElement;
    abstractions: Abstraction[] = [];
    selectedAbstraction: Abstraction;

    constructor(component: Component, name: string) {
        this.component = component;
        this.name = name;
        this.abstractions.push(new Abstraction(this, "./rttester/CreateMCProject/AbstractionNone.html"));
        //this.abstractions.push(new Abstraction(this, "./rttester/CreateMCProject/AbstractionRange.html"));
        this.abstractions.push(new Abstraction(this, "./rttester/CreateMCProject/AbstractionSimulation.html"));
        this.abstractions.push(new Abstraction(this, "./rttester/CreateMCProject/AbstractionGradient.html"));
    }
    display(hOutputList: HTMLUListElement, activate: boolean) {
        let self: Output = this;
        $('<div>').load("./rttester/CreateMCProject/Output.html", function (event: JQueryEventObject) {
            self.hOutput = <HTMLLinkElement>this.querySelector("#output");
            self.hOutput.innerHTML = self.name;
            self.hOutput.addEventListener("click", function () { self.component.selectOutput(self); });
            if (activate)
                self.component.selectOutput(self);
            hOutputList.appendChild(self.hOutput);
        });
    }
    setActive(active: boolean) {
        if (!active) {
            this.hOutput.classList.remove("active");
        } else {
            this.hOutput.classList.add("active");
            let hAbstractionHeading: HTMLHeadingElement = <HTMLHeadingElement>document.getElementById("abstractionHeader");
            hAbstractionHeading.innerHTML = "Abstraction for \"" + this.name + "\"";
            let hAbstractionDiv: HTMLDivElement = <HTMLDivElement>document.getElementById("abstractionDiv");
            while (hAbstractionDiv.firstChild) {
                hAbstractionDiv.removeChild(hAbstractionDiv.firstChild);
            }
            for (let i = 0; i < this.abstractions.length; ++i)
                this.abstractions[i].display(hAbstractionDiv, i == 0);
        }
    }
    selectAbstraction(abstraction: Abstraction) {
        if (abstraction == this.selectedAbstraction)
            return;
        if (this.selectedAbstraction != null)
            this.selectedAbstraction.setActive(false);
        this.selectedAbstraction = abstraction;
        this.selectedAbstraction.setActive(true);
    }
}

class Component {
    abstractions: Abstractions;
    name: string;
    outputs: Output[];
    selectedOutput: Output;
    hComponent: HTMLLinkElement;
    constructor(abstractions: Abstractions, name: string, outputs: string[]) {
        this.abstractions = abstractions;
        this.name = name;
        this.outputs = outputs.map((n) => new Output(this, n));
    }
    display(hComponentList: HTMLUListElement, activate: boolean) {
        let self: Component = this;
        $('<div>').load("./rttester/CreateMCProject/Component.html", function (event: JQueryEventObject) {
            self.hComponent = <HTMLLinkElement>this.querySelector("#component");
            self.hComponent.innerHTML = self.name;
            self.hComponent.addEventListener("click", function () { self.abstractions.selectComponent(self); });
            if (activate)
                self.abstractions.selectComponent(self);
            hComponentList.appendChild(self.hComponent);
        });
    }
    setActive(active: boolean) {
        if (!active) {
            this.hComponent.classList.remove("active");
            this.selectedOutput = null;
        } else {
            this.hComponent.classList.add("active");
            let hOutputHeading: HTMLHeadingElement = <HTMLHeadingElement>document.getElementById("outputHeading");
            let hOutputList: HTMLUListElement = <HTMLUListElement>document.getElementById("outputList");
            hOutputHeading.innerHTML = "Outputs of \"" + this.name + "\"";
            while (hOutputList.firstChild) {
                hOutputList.removeChild(hOutputList.firstChild);
            }
            for (let i = 0; i < this.outputs.length; ++i)
                this.outputs[i].display(hOutputList, i == 0);
        }
    }
    selectOutput(output: Output) {
        if (output == this.selectedOutput)
            return;
        if (this.selectedOutput != null)
            this.selectedOutput.setActive(false);
        this.selectedOutput = output;
        this.selectedOutput.setActive(true);
    }
}

class Abstractions {
    controller: CreateMCProjectController;
    components: Component[] = [];
    selectedComponent: Component;

    constructor(controller: CreateMCProjectController) {
        this.controller = controller;
        let hComponentList: HTMLUListElement = <HTMLUListElement>document.getElementById("componentList");

        // mockup data
        this.components.push(new Component(this, "Component A", ["Output X", "Output Y"]));
        this.components.push(new Component(this, "Component B", ["Output U", "Output V", "Output W"]));

        while (hComponentList.firstChild) {
            hComponentList.removeChild(hComponentList.firstChild);
        }
        for (let i = 0; i < this.components.length; ++i)
            this.components[i].display(hComponentList, i == 0);
    }
    selectComponent(component: Component) {
        if (component == this.selectedComponent)
            return;
        if (this.selectedComponent != null)
            this.selectedComponent.setActive(false);
        this.selectedComponent = component;
        this.selectedComponent.setActive(true);
    }
}



export class CreateMCProjectController extends IViewController {

    directory: string;
    abstractions: Abstractions;


    constructor(protected viewDiv: HTMLDivElement, directory: string) {
        super(viewDiv);
        this.directory = directory;
        IntoCpsApp.setTopName("RT-Tester Project");
    };


    xmiModelBrowser() {
        let remote = require("remote");
        let dialog = remote.require("dialog");
        let dialogResult: string[] = dialog.showOpenDialog({
            filters: [{ name: 'XMI-Files', extensions: ['xmi', 'xml'] }]
        });
        if (dialogResult != undefined) {
            var hText: HTMLInputElement = <HTMLInputElement>document.getElementById("XMIModelPathText");
            hText.value = dialogResult[0];
        }
    }


    loadXMIFile() {
        document.getElementById("settings").style.display = "block";
        this.abstractions = new Abstractions(this);
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
            "--skip-tests",
            "--skip-configure",
            "--skip-rttui",
            hPath.value
        ];
        const process = spawn(pythonPath, args);
        process.stdout.on('data', (data: string) => {
            hOutputText.textContent += data + "\n";
            hOutputText.scrollTop = hOutputText.scrollHeight;
        });
        process.stderr.on('data', (data: string) => {
            hOutputText.textContent += data + "\n";
            hOutputText.scrollTop = hOutputText.scrollHeight;
        });
        process.on('close', (code: number) => {
            document.getElementById("scriptRUN").style.display = "none";
            document.getElementById(code == 0 ? "scriptOK" : "scriptFAIL").style.display = "block";
        });
    }

}

