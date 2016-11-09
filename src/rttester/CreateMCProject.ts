
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

    createMCProject(c: ModalCommand.GenericModalCommand, xmiFileName: string, targetDir: string) {
        return new Promise<void>((resolve, reject) => {
            let exe = RTTester.pythonExecutable();
            let script = Path.join(RTTester.rttMBTInstallDir(), "bin", "rtt-mbt-create-fmi2-project.py");
            const spawn = require("child_process").spawn;
            let args: string[] = [
                script,
                "--skip-rttui",
                "--skip-configure",
                "--skip-tests",
                "--dir=" + targetDir,
                "--template=MC",
                xmiFileName
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

    createSignalMap(c: ModalCommand.GenericModalCommand, targetDir: string) {
        return new Promise<void>((resolve, reject) => {
            let exe = Path.join(RTTester.rttMBTInstallDir(), "bin", "sigmaptool");
            const spawn = require("child_process").spawn;
            let args: string[] = [
                "-projectDb", "model_dump.db"
            ];
            let env: any = process.env;
            const p = spawn(exe, args, { cwd: Path.join(targetDir, "model") });
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

    createProject(): void {
        let self = this;
        let xmiFileName = this.hPath.value;
        let targetDir = Path.normalize(Path.join(this.directory, this.hName.value));
        let modelDetailsPath = Path.join(targetDir, "model", "model-details.html");
        let modelDetailsTitle = RTTester.getRelativePathInProject(modelDetailsPath);

        ModalCommand.load("Create Model Checking Project",
            (c: ModalCommand.GenericModalCommand) => {
                self.createMCProject(c, xmiFileName, targetDir).then(
                    () => self.createDefaultAbstractionsPromise(c, xmiFileName, targetDir).then(
                        () => self.createSignalMap(c, targetDir).then(
                            () => {
                                c.displayTermination(true);
                                self.menuHandler.openHTMLInMainView(modelDetailsPath, modelDetailsTitle);
                            },
                            () => c.displayTermination(false)),
                        () => c.displayTermination(false)),
                    () => c.displayTermination(false));
            });
    }




}

