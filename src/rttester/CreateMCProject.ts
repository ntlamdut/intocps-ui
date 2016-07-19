
import {ViewController} from "../iViewController";
import {IntoCpsApp} from "../IntoCpsApp";
import Path = require("path");
import {RTTester} from "../rttester/RTTester";


class AbstractionSelectorMackop {
    hLinks: HTMLLinkElement[];
    constructor(ids: string[]) {
        this.hLinks = ids.map((id) => <HTMLLinkElement>document.getElementById(id));
        this.hLinks.forEach((l) => {
            l.addEventListener("click", () => { this.setActive(l); });
        });
    }
    setActive(link: HTMLLinkElement) {
        link.classList.add("active");
        link.classList.add("aria-expanded");
        this.hLinks.forEach((l) => {
            if (l != link) {
                l.classList.remove("active");
            }
        });
    }
}


class Output {
    component: Component;
    name: string;
    hOutput: HTMLLinkElement;

    constructor(component: Component, name: string) {
        this.component = component;
        this.name = name;
    }
    display(hOutputList: HTMLUListElement, activate: boolean) {
        let self: Output = this;
        $("<div>").load("./rttester/CreateMCProject/Output.html", function (event: JQueryEventObject) {
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
        }
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
        $("<div>").load("./rttester/CreateMCProject/Component.html", function (event: JQueryEventObject) {
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
        new AbstractionSelectorMackop([
            "headingAbstractionNone",
            "headingAbstractionRange",
            "headingAbstractionGradient",
            "headingAbstractionSimulation"]);
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



export class CreateMCProjectController extends ViewController {

    directory: string;
    abstractions: Abstractions;


    constructor(protected viewDiv: HTMLDivElement, directory: string) {
        super(viewDiv);
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


    loadXMIFile() {
        document.getElementById("settings").style.display = "block";
        this.abstractions = new Abstractions(this);
    }


    createProject(): void {
        document.getElementById("CreationParameters").style.display = "none";
        document.getElementById("Output").style.display = "block";
        let hPath: HTMLInputElement = <HTMLInputElement>document.getElementById("XMIModelPathText");
        let hOutputText: HTMLTextAreaElement = <HTMLTextAreaElement>document.getElementById("OutputText");
        let projectName = (<HTMLInputElement>document.getElementById("ProjectName")).value;
        let script: string = Path.join(RTTester.rttMBTInstallDir(), "bin/rtt-mbt-create-fmi2-project.py");
        let targetDir = Path.normalize(Path.join(this.directory, projectName));

        const spawn = require("child_process").spawn;
        let pythonPath = RTTester.pythonExecutable();
        let args: string[] = [
            script,
            "--dir=" + targetDir,
            "--skip-tests",
            "--skip-configure",
            "--skip-rttui",
            hPath.value
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

}

