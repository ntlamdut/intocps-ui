
import {ViewController} from "../iViewController";
import {IntoCpsApp} from "../IntoCpsApp";
import Path = require("path");
import {RTTester} from "../rttester/RTTester";
import {Abstractions, Interface, Output} from "./CTAbstractions";


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


    createMBTProjectPromise(xmiFileName: string, targetDir: string) {
        return new Promise<void>((resolve, reject) => {
            document.getElementById("CreationParameters").style.display = "none";
            document.getElementById("Output").style.display = "block";
            let hOutputText: HTMLTextAreaElement = <HTMLTextAreaElement>document.getElementById("OutputText");
            let script: string = Path.join(RTTester.rttMBTInstallDir(), "bin/rtt-mbt-create-fmi2-project.py");

            const spawn = require("child_process").spawn;
            let pythonPath = RTTester.pythonExecutable();
            let args: string[] = [
                script,
                "--dir=" + Path.join(targetDir, ".mbt"),
                "--skip-tests",
                "--skip-configure",
                "--skip-rttui",
                xmiFileName
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
                if (code == 0) {
                    resolve();
                } else {
                    reject();
                }
            });
        });
    }

    createDefaultAbstractionsPromise(xmiFileName: string, targetDir: string) {
        return new Promise<void>((resolve, reject) => {
            let extractInterface = (onLoad: (interfaceJSON: string) => void) => {
                let script: string = Path.join(RTTester.rttMBTInstallDir(), "bin/rtt-mbt-into-extract-interface.py");
                const spawn = require("child_process").spawn;
                let pythonPath = RTTester.pythonExecutable();
                let args: string[] = [
                    script,
                    "--input",
                    xmiFileName
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
            };
            let generateAbstractions = (interfaceJSON: any) => {
                let createOutputs = (outputs: any[]): Output[] => {
                    return outputs.reduce((oList: any[], o: any) => {
                        let name = o[0];
                        let type = o[1];
                        oList.push({
                            name: name,
                            type: type,
                        });
                        return oList;
                    }, []);
                };
                let createOutputInterfaces = (interfaces: any[]): Interface[] => {
                    return interfaces.reduce((iList: any[], i: any) => {
                        let name = i[0];
                        let type = i[1];
                        if (type == "output") {
                            let outputs = interfaceJSON["interfaces"][name][1];
                            iList.push({
                                name: name,
                                outputs: createOutputs(outputs)
                            });
                        }
                        return iList;
                    }, []);
                };
                let createComponents = (): Abstractions => {
                    return {
                        components: Object.keys(interfaceJSON.components).map((compName: string) => {
                            return {
                                name: compName,
                                outputInterfaces: createOutputInterfaces(interfaceJSON.components[compName]),
                            };
                        })
                    };
                };
                let abstractions = createComponents();
                Abstractions.writeToJSON(abstractions, Path.join(targetDir, "abstractions.json"));
            };
            extractInterface(generateAbstractions);
        });
    }

    createProject(): void {
        let xmiFileName = this.hPath.value;
        let projectName = (<HTMLInputElement>document.getElementById("ProjectName")).value;
        let targetDir = Path.normalize(Path.join(this.directory, projectName));

        let displaySuccess = () => {
            document.getElementById("scriptRUN").style.display = "none";
            document.getElementById("scriptOK").style.display = "block";
        };
        let displayFailure = () => {
            document.getElementById("scriptRUN").style.display = "none";
            document.getElementById("scriptFAIL").style.display = "block";
        };
        this.createMBTProjectPromise(xmiFileName, targetDir)
            .then(() => this.createDefaultAbstractionsPromise(xmiFileName, targetDir)
                .then(displaySuccess,
                displayFailure),
            displayFailure);
    }




}

