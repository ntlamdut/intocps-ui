
import {ViewController} from "../iViewController";
import {IntoCpsApp} from "../IntoCpsApp";
import Path = require("path");
import fs = require("fs");
import {RTTester} from "../rttester/RTTester";
import {Abstractions, Interface, Output} from "./CTAbstractions";
import {Utilities} from "../utilities";
import {IntoCpsAppMenuHandler} from "../IntoCpsAppMenuHandler";


export class CreateMCProjectController extends ViewController {

    menuHandler: IntoCpsAppMenuHandler;
    directory: string;
    hPath: HTMLInputElement;

    constructor(protected viewDiv: HTMLDivElement, menuHandler: IntoCpsAppMenuHandler, directory: string) {
        super(viewDiv);
        this.menuHandler = menuHandler;
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

    appendLog(msg: string) {
        let hOutputText: HTMLTextAreaElement = <HTMLTextAreaElement>document.getElementById("OutputText");
        hOutputText.textContent += msg + "\n";
        hOutputText.scrollTop = hOutputText.scrollHeight;
    }

    createMBTProjectPromise(targetDir: string) {
        let self = this;
        return new Promise<void>((resolve, reject) => {
            document.getElementById("CreationParameters").style.display = "none";
            document.getElementById("Output").style.display = "block";
            try {
                fs.mkdirSync(targetDir);
            } catch (err) {
                self.appendLog(err);
                reject();
                return;
            }
            let script: string = Path.join(RTTester.rttInstallDir(), "bin", "rtt-init-project.py");
            const spawn = require("child_process").spawn;
            let pythonPath = RTTester.pythonExecutable();
            let args: string[] = [
                script,
                "--dir=" + targetDir,
                "--use=MC"
            ];
            let env: any = process.env;
            env["RTTDIR"] = RTTester.rttInstallDir();
            const p = spawn(pythonPath, args, { env: env });
            p.stdout.on("data", self.appendLog.bind(self));
            p.stderr.on("data", self.appendLog.bind(self));
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
        let self = this;
        return new Promise<void>((resolve, reject) => {
            let extractInterface = (onLoad: (interfaceJSON: string) => void) => {
                let script: string = Path.join(RTTester.rttMBTInstallDir(), "bin", "rtt-mbt-into-extract-interface.py");
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
                const p = spawn(pythonPath, args, { env: env });
                p.stdout.on("data", (data: string) => { stdout += data; });
                p.stderr.on("data", self.appendLog.bind(self));
                p.on("close", (code: number) => {
                    if (code != 0) {
                        reject();
                    } else {
                        let obj = JSON.parse(stdout);
                        onLoad(obj);
                        resolve();
                    }
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

    createCopyModelPromise(xmiFileName: string, targetDir: string) {
        let self = this;
        return new Promise<void>((resolve, reject) => {
            // copy xmi file
            let targetFileName = Path.join(targetDir, "model", "model.xmi");
            Utilities.copyFile(xmiFileName, targetFileName,
                (error: string) => {
                    if (error) {
                        self.appendLog(error);
                        reject();
                    } else {
                        resolve();
                    }
                });
        });
    }

    createCreateModelDBPromise(xmiFileName: string, targetDir: string) {
        let self = this;
        return new Promise<void>((resolve, reject) => {
            let exe: string = Path.join(RTTester.rttMBTInstallDir(), "bin", "rtt-mbt-tcgen");
            const spawn = require("child_process").spawn;
            let args: string[] = [
                "-model", xmiFileName,
                "-proj", "test",
                "-projectDb", Path.join(targetDir, "model", "model_dump.db")
            ];
            let env: any = process.env;
            env["RTTDIR"] = RTTester.rttInstallDir();
            const p = spawn(exe, args, { env: env });
            p.stdout.on("data", self.appendLog.bind(self));
            p.stderr.on("data", self.appendLog.bind(self));
            p.on("close", (code: number) => {
                if (code != 0) {
                    reject();
                } else {
                    resolve();
                }
            });
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
        this.createMBTProjectPromise(targetDir)
            .then(() => this.createCopyModelPromise(xmiFileName, targetDir)
                .then(() => this.createCreateModelDBPromise(xmiFileName, targetDir)
                    .then(() => this.createDefaultAbstractionsPromise(xmiFileName, targetDir)
                        .then(displaySuccess,
                        displayFailure),
                    displayFailure),
                displayFailure),
            displayFailure);
    }




}

