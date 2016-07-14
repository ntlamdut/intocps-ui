
///<reference path="../../typings/browser/ambient/sql.js/index.d.ts"/>
///<reference path="../../typings/browser/ambient/ace/index.d.ts"/>


import {SourceDom} from "../sourceDom";
import {IViewController} from "../iViewController";
import {IntoCpsApp} from "../IntoCpsApp"
import * as Settings from  "../settings/settings"
import {SettingKeys} from "../settings/SettingKeys";
import Path = require('path');
import {RTTester} from "../rttester/RTTester";
import fs = require("fs");


export class LTLEditorController extends IViewController {

    fileName: string;
    json: any = {};
    ltlEditor: any;
    hBMCSteps: HTMLInputElement;

    constructor(protected viewDiv: HTMLDivElement, fileName: string) {
        super(viewDiv);
        this.fileName = fileName;
        IntoCpsApp.setTopName("LTL Formula");
        this.hBMCSteps = <HTMLInputElement>document.getElementById("BMCSteps");
        this.ltlEditor = ace.edit("ltlFormula");
        this.ltlEditor.$blockScrolling = Infinity;
        var langTools: any = ace.require("ace/ext/language_tools");
        this.configureCompleter(langTools);
        this.load();
        document.getElementById("save").addEventListener("click", () => this.save());
        document.getElementById("save").addEventListener("click", () => this.check());
    }

    load() {
        let data = fs.readFileSync(this.fileName, 'utf-8');
        console.log("this.fileName=" + this.fileName);
        console.log("data=" + data);
        this.json = JSON.parse(data);
        console.log("json=" + this.json);
        this.ltlEditor.setValue(this.json["goals"][0]["ltl-formula"]);
        this.hBMCSteps.value = this.json["solver-config"]["max-solver-steps"];
    }

    save() {
        // TODO: save fields.
        fs.writeFileSync(this.fileName, JSON.stringify(this.json, null, 4));
    }

    check() {
        this.save();

    }


    configureCompleter(langTools: any) {
        let fs = require('fs');
        let SQL = require('sql.js');
        let dbFile = Path.join(RTTester.getProjectOfFile(this.fileName), "model", "model_dump.db");
        fs.readFile(dbFile, (err: any, filebuffer: any) => {
            if (err) throw err;
            let db = new SQL.Database(filebuffer);
            let stmt = db.prepare("SELECT * FROM Symbols WHERE FullName LIKE :pat");
            let completer: any = {
                identifierRegexps: [/[a-zA-Z_0-9\.]/],
                getCompletions: function (editor: any, session: any, pos: any, prefix: any, callback: any) {
                    if (prefix.length === 0) { callback(null, []); return }
                    let completions: any = [];

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

