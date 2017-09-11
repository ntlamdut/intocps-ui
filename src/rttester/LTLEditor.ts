import { ViewController } from "../iViewController";
import { IntoCpsApp } from "../IntoCpsApp";
import Path = require("path");
import { RTTester } from "../rttester/RTTester";
import fs = require("fs");
import * as RTesterModalCommandWindow from "./GenericModalCommand";
import { IntoCpsAppMenuHandler } from "../IntoCpsAppMenuHandler";


export class LTLEditorController extends ViewController {

    menuHandler: IntoCpsAppMenuHandler;
    ltlQueryFileName: string;
    ltlEditor: any;
    hBMCSteps: HTMLInputElement;
    hRequirements: HTMLInputElement;
    hVerifiesButton: HTMLButtonElement;
    hViolatesButton: HTMLButtonElement;

    constructor(protected viewDiv: HTMLDivElement, menuHandler: IntoCpsAppMenuHandler, folderName: string) {
        super(viewDiv);
        this.menuHandler = menuHandler;
        this.ltlQueryFileName = Path.join(folderName, "query.json");
        IntoCpsApp.setTopName("LTL Formula");
        this.hBMCSteps = <HTMLInputElement>document.getElementById("BMCSteps");
        this.hRequirements = <HTMLInputElement>document.getElementById("Requirements");
        this.hVerifiesButton = <HTMLButtonElement>document.getElementById("verifies");
        this.hViolatesButton = <HTMLButtonElement>document.getElementById("violates");
        this.ltlEditor = ace.edit("ltlFormula");
        this.ltlEditor.$blockScrolling = Infinity;
        let langTools: any = ace.require("ace/ext/language_tools");
        this.configureCompleter(langTools);
        this.load();
        document.getElementById("save").addEventListener("click", () => this.save());
        document.getElementById("check").addEventListener("click", () => this.check());
    }

    load() {
        let data = fs.readFileSync(this.ltlQueryFileName, "utf-8");
        let json = JSON.parse(data);
        this.ltlEditor.setValue(json["ltlFormula"]);
        this.hBMCSteps.value = json["BMCSteps"];
        this.hRequirements.value = json["RequirementsToLink"].join(", ");
        if (json["TracabilityLink"] == "verifies") {
            (<any>this.hViolatesButton).checked = false;
            this.hViolatesButton.parentElement.classList.remove("active");
            (<any>this.hVerifiesButton).checked = true;
            this.hVerifiesButton.parentElement.classList.add("active");
        } else {
            (<any>this.hVerifiesButton).checked = false;
            this.hVerifiesButton.parentElement.classList.remove("active");
            (<any>this.hViolatesButton).checked = true;
            this.hViolatesButton.parentElement.classList.add("active");
        }
    }

    save() {
        let requirements = this.hRequirements.value.split(',').map((r: string)=> r.trim());
        let json = {
            ltlFormula: this.ltlEditor.getValue(),
            BMCSteps: this.hBMCSteps.value,
            RequirementsToLink: requirements,
            TracabilityLink: (<any>this.hVerifiesButton).checked ? "verifies" : "violates",
        };
        fs.writeFileSync(this.ltlQueryFileName, JSON.stringify(json, null, 4));
        let proj = RTTester.getProjectOfFile(this.ltlQueryFileName);
        let queryFolder = Path.dirname(RTTester.getRelativePathInProject(this.ltlQueryFileName));
        RTTester.queueEvent("Define-MC-Query", proj, queryFolder);
    }

    check() {
        let self = this;
        this.save();
        let projectPath = RTTester.getProjectOfFile(this.ltlQueryFileName);
        let queryDir = Path.dirname(this.ltlQueryFileName);
        let queryName = Path.basename(queryDir);
        let modelCheckingReportPath = Path.join(queryDir, "model-checking-report.html");
        let modelCheckingReportTitle = RTTester.getRelativePathInProject(modelCheckingReportPath);
        let cmd = {
            title: "Check LTL Query",
            command: RTTester.pythonExecutable(),
            arguments: [
                Path.normalize(Path.join(RTTester.rttMBTInstallDir(), "bin", "rtt-mbt-mc.py")),
                queryName],
            options: {
                env: RTTester.genericCommandEnv(this.ltlQueryFileName),
                cwd: queryDir
            },
            onSuccess: () => { self.menuHandler.openMCResult(modelCheckingReportPath) }
        };
        RTesterModalCommandWindow.runCommand(cmd);
    }

    configureCompleter(langTools: any) {
        let fs = require("fs");
        let SQL = require("sql.js");
        let dbFile = Path.join(RTTester.getProjectOfFile(this.ltlQueryFileName), "model", "model_dump.db");
        fs.readFile(dbFile, (err: any, filebuffer: any) => {
            if (err) throw err;
            let db = new SQL.Database(filebuffer);
            let stmt = db.prepare("SELECT * FROM Symbols WHERE FullName LIKE :pat");
            let completer: any = {
                identifierRegexps: [/[a-zA-Z_0-9\.]/],
                getCompletions: function (editor: any, session: any, pos: any, prefix: any, callback: any) {
                    if (prefix.length === 0) { callback(null, []); return; }
                    let completions: any = [];

                    // Completions for some builtins symbols
                    let builtinSymbols: { [key: string]: string; } = {
                        "false": "constant",
                        "true": "constant",
                        "_timeTick": "time",
                        "_stable": "bool",
                    };
                    for (let sym in builtinSymbols) {
                        if (sym.indexOf(prefix) != -1) {
                            completions.push({
                                name: sym,
                                value: sym,
                                meta: builtinSymbols[sym],
                            });
                        }
                    }

                    // Snippets for LTL operators
                    let ltlOps: { [key: string]: string; } = {
                        "Next": "Next ([\u2026])",
                        "Finally": "Finally ([\u2026])",
                        "Globally": "Globally ([\u2026])",
                        "Until": "([\u2026]) Until ([\u2026])",
                        "Exists": "Exists \u2026 : ([\u2026])"
                    };
                    for (let op in ltlOps) {
                        if (op.indexOf(prefix) != -1) {
                            completions.push({
                                name: op,
                                value: op,
                                meta: "LTL-Operator",
                                snippet: ltlOps[op],
                            });
                        }
                    }

                    // Completions for model symbols
                    stmt.bind(["%" + prefix + "%"]);
                    while (stmt.step()) { //
                        let r = stmt.getAsObject();
                        completions.push({
                            name: r["FullName"],
                            value: r["FullName"],
                            meta: r["SymbolType"]
                        });
                    }
                    stmt.reset();
                    if (completions.length > 0) {
                        callback(null, completions);
                    }
                }
            };
            langTools.setCompleters([completer]);
            this.ltlEditor.setOptions({
                enableBasicAutocompletion: true,
                enableLiveAutocompletion: true
            });
        });
    }

}

