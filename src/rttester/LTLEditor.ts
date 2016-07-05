
///<reference path="../../typings/browser/ambient/sql.js/index.d.ts"/>
///<reference path="../../typings/browser/ambient/ace/index.d.ts"/>


import {SourceDom} from "../sourceDom";
import {IViewController} from "../iViewController";
import {IntoCpsApp} from "../IntoCpsApp"
import * as Settings from  "../settings/settings"
import {SettingKeys} from "../settings/SettingKeys";
import Path = require('path');
import {RTTester} from "../rttester/RTTester";



export class LTLEditorController extends IViewController {

    fileName: string;

    constructor(protected viewDiv: HTMLDivElement, fileName: string) {
        super(viewDiv);
        this.fileName = fileName;
        IntoCpsApp.setTopName("LTL Formula");
        var langTools = ace.require("ace/ext/language_tools");
        var editor = ace.edit("editor");
        editor.setOptions({ enableBasicAutocompletion: true });
        editor.$blockScrolling = Infinity;
        let fs = require('fs');
        let SQL = require('sql.js');
        let dbFile = Path.join(RTTester.getProjectOfFile(fileName), "model", "model_dump.db");
        fs.readFile(dbFile, (err: any, filebuffer: any) => {
            if (err) throw err;
            let db = new SQL.Database(filebuffer);
            let stmt = db.prepare("SELECT * FROM Symbols WHERE FullName LIKE :pat");
            let completer: any = {
                getCompletions: function (editor: any, session: any, pos: any, prefix: any, callback: any) {
                    if (prefix.length === 0) { callback(null, []); return }
                    stmt.bind(["%" + prefix + "%"]);
                    let completions: any = [];
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
            langTools.addCompleter(completer);
        });
    }

}

