
import { ViewController } from "../iViewController";
import { IntoCpsApp } from "../IntoCpsApp";
import { Abstractions, Interface, Output, Component, Abstraction } from "../rttester/CTAbstractions";
import { SignalMap, SignalMapEntry } from "./SignalMap";
import Path = require("path");
import { RTTester } from "../rttester/RTTester";


let makeAbstractionTreeID = (function () {
    let counter = 0;
    return function () { return "AbstractionTreeId" + counter++; };
})();

export class CTAbstractionsView extends ViewController {

    jsonFileName: string;
    signalMap: SignalMap;
    abstractions: Abstractions;
    currentOutput: Output;

    hSelectAbstractionDiv: HTMLDivElement;
    hAbstractionSettings: HTMLDivElement;

    hLowerBound: HTMLInputElement;
    hUpperBound: HTMLInputElement;
    hGradient: HTMLInputElement;
    hGradientTimeFrame: HTMLInputElement;
    hSimulationFile: HTMLInputElement;
    hSimulationMaxValueRange: HTMLInputElement;
    hAbstractionSelection: HTMLInputElement;


    constructor(protected viewDiv: HTMLDivElement, jsonFileName: string) {
        super(viewDiv);
        let self = this;
        this.hSelectAbstractionDiv = <HTMLDivElement>document.getElementById("SelectAbstraction");
        this.hAbstractionSettings = <HTMLDivElement>document.getElementById("AbstractionSettings");
        this.hLowerBound = <HTMLInputElement>document.getElementById("lowerBound");
        this.hUpperBound = <HTMLInputElement>document.getElementById("upperBound");
        this.hGradient = <HTMLInputElement>document.getElementById("gradient");
        this.hGradientTimeFrame = <HTMLInputElement>document.getElementById("gradientTimeFrame");
        this.hSimulationFile = <HTMLInputElement>document.getElementById("simulationFile");
        this.hSimulationMaxValueRange = <HTMLInputElement>document.getElementById("simulationMaxValueRange");
        this.hAbstractionSelection = <HTMLInputElement>document.getElementById("AbstractionSelection");
        this.jsonFileName = jsonFileName;
        IntoCpsApp.setTopName("Configure Abstractions");
        let signalMapFileName = Path.join(RTTester.getProjectOfFile(jsonFileName), "model", "signalmap.csv");
        SignalMap.loadFromFile(signalMapFileName, (signalMap) => {
            this.signalMap = signalMap;
            this.abstractions = Abstractions.loadFromJSON(jsonFileName);
            this.displayAbstractions();
            // Actions for radio buttons:
            let abstractionSelections = <HTMLInputElement[]><any>document.getElementsByName("AbstractionSelection");
            for (let i = 0; i < abstractionSelections.length; ++i) {
                abstractionSelections[i].onclick = (ev: MouseEvent) => {
                    let selectionValue = abstractionSelections[i].value;
                    this.currentOutput.abstraction.selected = selectionValue;
                    self.displaySelectedAbstraction(selectionValue);
                };
            }
            this.hLowerBound.onchange = (ev: Event) => {
                self.currentOutput.abstraction.rangeBased.lowerBound = +this.hLowerBound.value;
            };
            this.hUpperBound.onchange = (ev: Event) => {
                self.currentOutput.abstraction.rangeBased.upperBound = +this.hUpperBound.value;
            };
            this.hGradient.onchange = (ev: Event) => {
                self.currentOutput.abstraction.gradientBased.gradient = +this.hGradient.value;
            };
            this.hGradientTimeFrame.onchange = (ev: Event) => {
                self.currentOutput.abstraction.gradientBased.timeFrame = +this.hGradientTimeFrame.value;
            };
            this.hSimulationFile.onchange = (ev: Event) => {
                self.currentOutput.abstraction.simulationBased.fileName = this.hSimulationFile.value;
            };
            this.hSimulationMaxValueRange.onchange = (ev: Event) => {
                self.currentOutput.abstraction.simulationBased.maxValueRange = +this.hSimulationMaxValueRange.value;
            };
            document.getElementById("simulationFileBrowse").onclick = (ev: MouseEvent) => {
                let remote = require("electron").remote;
                let dialog = remote.dialog;
                let dialogResult: string[] = dialog.showOpenDialog({
                    filters: [{ name: "Signal Log-Files (*.json)", extensions: ["json"] }]
                });
                if (dialogResult != undefined) {
                    self.currentOutput.abstraction.simulationBased.fileName
                        = this.hSimulationFile.value
                        = dialogResult[0];
                }
            };
        });
    }

    displaySelectedAbstraction(name: string) {
        let abstractionSelections = <HTMLInputElement[]><any>document.getElementsByName("AbstractionSelection");
        // Hide deselected settings.
        for (let i = 0; i < abstractionSelections.length; ++i) {
            if (abstractionSelections[i].value != name) {
                document.getElementById("AbstractionSettings_" + abstractionSelections[i].value).style.display = "none";
            }
        }
        // Show selected settings.
        document.getElementById("AbstractionSettings_" + name).style.display = "block";
        // Show container if other than "No abstraction" has been selected
        document.getElementById("AbstractionSettings").style.display =
            name == "none" ? "none" : "block";
    }

    selectOutput(o: Output) {
        this.currentOutput = o;
        if (o == null) {
            this.hSelectAbstractionDiv.style.display = "none";
            this.hAbstractionSettings.style.display = "none";
        } else {
            if (!o.abstraction) {
                o.abstraction = new Abstraction();
                o.abstraction.rangeBased.lowerBound = this.signalMap.entries[o.name].lowerBound;
                o.abstraction.rangeBased.upperBound = this.signalMap.entries[o.name].upperBound;
            }
            this.hLowerBound.value = o.abstraction.rangeBased.lowerBound.toString();
            this.hUpperBound.value = o.abstraction.rangeBased.upperBound.toString();
            this.hGradient.value = o.abstraction.gradientBased.gradient.toString();
            this.hGradientTimeFrame.value = o.abstraction.gradientBased.timeFrame.toString();
            this.hSimulationFile.value = o.abstraction.simulationBased.fileName ?
                o.abstraction.simulationBased.fileName.toString() : "";
            this.hSimulationMaxValueRange.value = o.abstraction.simulationBased.maxValueRange.toString();
            this.hSelectAbstractionDiv.style.display = "block";
            this.hAbstractionSettings.style.display = "none";
            let abstraction = o.abstraction.selected;
            let h = <HTMLInputElement>document.getElementById("AbstractionSelection_" + abstraction);
            h.checked = true;
            this.hSelectAbstractionDiv.style.display = "block";
            this.displaySelectedAbstraction(abstraction);
        }
    }

    save() {
        Abstractions.writeToJSON(this.abstractions, this.jsonFileName);
        let abstractionSignalMap: SignalMap = jQuery.extend(true, {}, this.signalMap);
        for (let c of this.abstractions.components) {
            for (let i of c.outputInterfaces) {
                for (let v of i.outputs) {
                    if (v.abstraction && v.abstraction.selected == "range") {
                        abstractionSignalMap.entries[v.name].lowerBound = +v.abstraction.rangeBased.lowerBound;
                        abstractionSignalMap.entries[v.name].upperBound = +v.abstraction.rangeBased.upperBound;
                    }
                }
            }
        }
        let abtstractionSignalMapFileName = Path.join(RTTester.getProjectOfFile(this.jsonFileName),
            "model", "signalmap-with-interval-abstraction.csv");
        abstractionSignalMap.saveToFile(abtstractionSignalMapFileName,
            (error) => {
                if (error) console.log(error);
                else {
                    let proj = RTTester.getProjectOfFile(abtstractionSignalMapFileName);
                    RTTester.queueEvent("Define-CT-Abstraction", proj);
                }
            });
    }

    displayAbstractions(): void {
        let self = this;

        let createOutputNode = (o: Output) => {
            return {
                id: makeAbstractionTreeID(),
                text: o.name + ": " + o.type,
                img: "icon-folder",
                nodes: <any>[],
                output: o,
                onClick: (event: any) => { self.selectOutput(event.object.output); }
            };
        };

        let createOutputInterfaceNode = (i: Interface) => {
            return {
                id: makeAbstractionTreeID(),
                text: i.name,
                img: "icon-page",
                nodes: i.outputs.map((o: Output) => createOutputNode(o)),
                onClick: (event: any) => { self.selectOutput(null); }
            };
        };

        let createComponentNode = (c: Component) => {
            return {
                id: makeAbstractionTreeID(),
                text: c.name,
                img: "icon-folder",
                nodes: c.outputInterfaces.map((i: Interface) => createOutputInterfaceNode(i)),
                expanded: true,
                onClick: (event: any) => { self.selectOutput(null); }
            };
        };

        $("#AbstractionsTree").w2sidebar({
            name: makeAbstractionTreeID(),
            menu: [],
            nodes: this.abstractions.components.map((c: Component) => createComponentNode(c))
        });
    }

}

