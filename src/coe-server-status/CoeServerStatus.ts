///<reference path="../../typings/browser/ambient/github-electron/index.d.ts"/>
///<reference path="../../typings/browser/ambient/node/index.d.ts"/>
///<reference path="../../typings/browser/ambient/jquery/index.d.ts"/>
/// <reference path="../../node_modules/typescript/lib/lib.es6.d.ts" />

import {IntoCpsApp} from  "../IntoCpsApp";
import {SettingKeys} from "../settings/SettingKeys";
import {remote} from "electron";
import * as Path from 'path';

var globalCoeIsRunning = false;

window.onload = function () {
    if (window.location.search === "?data=autolaunch")
        launchCoe();
};

function coeOnlineCheck() {
    let url = IntoCpsApp.getInstance().getSettings().getSetting(SettingKeys.COE_URL) || "localhost:8082";
    let request = $.getJSON(`http://${url}/version`);

    let onlineAlert = document.getElementById("online-alert");
    let offlineAlert = document.getElementById("offline-alert");

    setTimeout(() => request.abort(), 2000);

    request.fail(() => {
        onlineAlert.innerHTML = `Co-Simulation Engine, offline no connection at: ${url}`;

        onlineAlert.style.display = "block";
        offlineAlert.style.display = "none";

        setTimeout(() => coeOnlineCheck(), 2000);
    })
    .done(data => {
        offlineAlert.innerHTML = `Co-Simulation Engine, version: ${data.version}, online at: ${url}`;

        onlineAlert.style.display = "none";
        offlineAlert.style.display = "block";
    });
}

function coeClose() {
    if (!globalCoeIsRunning) {
        return realClose();
    }

    remote.dialog.showMessageBox({
            type: 'question',
            buttons: ["No", "Yes"],
            message: "Are you sure you want to terminate the COE?"
        },
        button => {if (button === 1) return realClose()}
    );

    return true;
}

function realClose() {
    window.top.close();
    return false;
}

function launchCoe() {
    var spawn = require('child_process').spawn;

    let installDir = IntoCpsApp.getInstance().getSettings().getValue(SettingKeys.INSTALL_TMP_DIR);
    let coePath = Path.join(installDir, "coe.jar");
    let childCwd = Path.join(installDir, "coe-working-dir");

    var mkdirp = require('mkdirp');
    mkdirp.sync(childCwd);

    var child = spawn('java', ['-jar', coePath], {
        detached: true,
        shell: false,
        cwd: childCwd
    });
    child.unref();
    globalCoeIsRunning = true;

    let div = document.createElement("div");
    let panel = createPanel("Console", div);
    document.getElementById("coe-console").appendChild(panel);

    child.stdout.on('data', function (data: any) {
        console.log('stdout: ' + data);
        //Here is where the output goes
        let m = document.createElement("span");
        m.innerText = data + "";
        div.appendChild(m);
    });

    child.stderr.on('data', function (data: any) {
        console.log('stderr: ' + data);
        //Here is where the error output goes
        let m = document.createElement("span");
        // m.style.color="#d9534f";
        m.className = "text-danger";
        m.innerText = data + "";
        div.appendChild(m);
    });
}

function createPanel(title: string, content: HTMLElement): HTMLElement {
    var divPanel = document.createElement("div");
    divPanel.className = "panel panel-default";

    var divTitle = document.createElement("div");
    divTitle.className = "panel-heading";
    divTitle.innerText = title;

    var divBody = document.createElement("div");
    divBody.className = "panel-body";
    divBody.appendChild(content);

    divPanel.appendChild(divTitle);
    divPanel.appendChild(divBody);

    return divPanel;
}


