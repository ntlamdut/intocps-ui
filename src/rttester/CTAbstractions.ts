
import {ViewController} from "../iViewController";
import Path = require("path");
import {RTTester} from "../rttester/RTTester";

let makeAbstractionTreeID = (function () {
    let counter = 0;
    return function () { return counter++; };
})();

export class CTAbstractionsView extends ViewController {

    viewDiv: HTMLDivElement;
    xmiFileName: string;


    constructor(protected _viewDiv: HTMLDivElement, xmiFileName: string) {
        super(_viewDiv);
        this.viewDiv = _viewDiv;
        this.xmiFileName = xmiFileName;
        this.extractInterface(this.displayAbstractions.bind(this));
    }

    extractInterface(onLoad: (json: string) => void) {
        let script: string = Path.join(RTTester.rttMBTInstallDir(), "bin/rtt-mbt-into-extract-interface.py");
        const spawn = require("child_process").spawn;
        let pythonPath = RTTester.pythonExecutable();
        let args: string[] = [
            script,
            "--input",
            this.xmiFileName
        ];
        let env: any = process.env;
        env["RTTDIR"] = RTTester.rttInstallDir();
        let stdout = "";
        let stderr = "";
        const p = spawn(pythonPath, args, { env: env });
        p.stdout.on("data", (data: string) => { stdout += data; });
        p.stderr.on("data", (data: string) => { stderr += data; });
        p.on("close", (code: number) => {
            if (code != 0) throw stderr;
            let obj = JSON.parse(stdout);
            onLoad(obj);
        });
    }

    displayAbstractions(json: any): void {

        let createOutputNodes = (outputs: any[]) => {
            return outputs.reduce((oList: any[], o: any) => {
                let name = o[0];
                let type = o[1];
                oList.push({
                    id: makeAbstractionTreeID(),
                    text: name + ": " + type,
                    img: "icon-folder"
                });
                return oList;
            }, []);
        };

        let createOutputInterfaceNodes = (interfaces: any[]) => {
            return interfaces.reduce((iList: any[], i: any) => {
                let name = i[0];
                let type = i[1];
                if (type == "output") {
                    let outputs = json["interfaces"][name][1];
                    iList.push({
                        id: makeAbstractionTreeID(),
                        text: name,
                        img: "icon-folder",
                        nodes: createOutputNodes(outputs)
                    });
                }
                return iList;
            }, []);
        };

        let createComponentNodes = () => {
            return Object.keys(json.components).map((compName: string) => {
                return {
                    id: makeAbstractionTreeID(),
                    text: compName,
                    img: "icon-folder",
                    nodes: createOutputInterfaceNodes(json.components[compName]),
                    expanded: true
                };
            });
        };

        let tree = $(this.viewDiv).w2sidebar({
            name: "AbstractionsTree",
            menu: [],
            nodes: createComponentNodes()
        });
    }

}

