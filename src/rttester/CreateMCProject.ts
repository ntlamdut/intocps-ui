
import {ViewController} from "../iViewController";
import {IntoCpsApp} from "../IntoCpsApp";
import Path = require("path");
import fs = require("fs");
import {RTTester} from "../rttester/RTTester";
import {Abstractions, Interface, Output} from "./CTAbstractions";
import {Utilities} from "../utilities";
import {IntoCpsAppMenuHandler} from "../IntoCpsAppMenuHandler";
import * as ModalCommand from "./GenericModalCommand";


export class CreateMCProjectController extends ViewController {

    menuHandler: IntoCpsAppMenuHandler;
    directory: string;
    hName: HTMLInputElement;
    hPath: HTMLInputElement;
    hBrowseButton: HTMLInputElement;
    hCreateButton: HTMLButtonElement;

    constructor(protected viewDiv: HTMLDivElement, menuHandler: IntoCpsAppMenuHandler, directory: string) {
        super(viewDiv);
        this.menuHandler = menuHandler;
        this.directory = directory;
        IntoCpsApp.setTopName("RT-Tester Project");
        this.hName = <HTMLInputElement>document.getElementById("ProjectName");
        this.hPath = <HTMLInputElement>document.getElementById("XMIModelPathText");
        this.hBrowseButton = <HTMLInputElement>document.getElementById("browseButton");
        this.hCreateButton = <HTMLButtonElement>document.getElementById("createButton");
    };


    xmiModelBrowser() {
        let remote = require("electron").remote;
        let dialog = remote.dialog;
        let dialogResult: string[] = dialog.showOpenDialog({
            filters: [{ name: "XMI-Files", extensions: ["xmi", "xml"] }]
        });
        if (dialogResult != undefined) {
            this.hPath.value = dialogResult[0];
        }
    }

    createMBTProjectPromise(c: ModalCommand.GenericModalCommand, targetDir: string) {
        return new Promise<void>((resolve, reject) => {
            try {
                fs.mkdirSync(targetDir);
            } catch (err) {
                c.appendLog(err);
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
            p.stdout.on("data", c.appendLog.bind(c));
            p.stderr.on("data", c.appendLog.bind(c));
            p.on("exit", (code: number) => {
                if (code == 0) {
                    resolve();
                } else {
                    reject();
                }
            });
        });
    }

    createDefaultAbstractionsPromise(c: ModalCommand.GenericModalCommand, xmiFileName: string, targetDir: string) {
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
                p.stdout.on("data", (s: string) => { stdout += s; });
                p.stderr.on("data", c.appendLog.bind(c));
                p.on("close", (code: number) => {
                    if (code != 0) {
                        reject();
                    } else {
                        try {
                            let obj = JSON.parse(stdout);
                            onLoad(obj);
                            resolve();
                        } catch (e) {
                            c.appendLog("Problem when parsing interface description: " + e);
                            c.appendLog("Interface description was: " + stdout);
                            reject();
                        }
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

    createCopyModelPromise(c: ModalCommand.GenericModalCommand, xmiFileName: string, targetDir: string) {
        return new Promise<void>((resolve, reject) => {
            // copy xmi file
            let targetFileName = Path.join(targetDir, "model", "model.xmi");
            Utilities.copyFile(xmiFileName, targetFileName,
                (error: string) => {
                    if (error) {
                        c.appendLog(error);
                        reject();
                    } else {
                        resolve();
                    }
                });
        });
    }

    createCreateModelDBPromise(c: ModalCommand.GenericModalCommand, xmiFileName: string, targetDir: string) {
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
            p.stdout.on("data", c.appendLog.bind(c));
            p.stderr.on("data", c.appendLog.bind(c));
            p.on("exit", (code: number) => {
                if (code != 0) {
                    reject();
                } else {
                    resolve();
                }
            });
        });
    }

    createModel(c: ModalCommand.GenericModalCommand, targetDir: string) {
        return new Promise<void>((resolve, reject) => {
        });
    }

    createProject(): void {
        let xmiFileName = this.hPath.value;
        let targetDir = Path.normalize(Path.join(this.directory, this.hName.value));
        this.hName.disabled = true;
        this.hPath.disabled = true;
        this.hBrowseButton.disabled = true;
        this.hCreateButton.disabled = true;

        ModalCommand.load("Create Model Checking Project",
            (c: ModalCommand.GenericModalCommand) => {
                let actions = [
                    this.createMBTProjectPromise(c, targetDir),
                    this.createCopyModelPromise(c, xmiFileName, targetDir),
                    this.createCreateModelDBPromise(c, xmiFileName, targetDir),
                    this.createDefaultAbstractionsPromise(c, xmiFileName, targetDir),
                ];
                actions.reduce((s, a) => {
                    return s.then(() => a, () => c.displayTermination(false));
                }).then(() => c.displayTermination(true));
            });
    }




}

