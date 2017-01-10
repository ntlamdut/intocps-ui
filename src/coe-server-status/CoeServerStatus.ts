///<reference path="../../typings/browser/ambient/jquery/index.d.ts"/>
/// <reference path="../../node_modules/typescript/lib/lib.es6.d.ts" />

import { IntoCpsApp } from "../IntoCpsApp";
import { SettingKeys } from "../settings/SettingKeys";
import { remote, ipcRenderer } from "electron";
import * as Path from 'path';
import * as child_process from 'child_process'

var globalChild: any;
var intoCpsAppIns = IntoCpsApp.getInstance();
var killWindow = false;
var preventUnload = true;
window.onload = function () {
    if (window.location.search === "?data=autolaunch")
        launchCoe();
};

function hideBehaviour(ev: Event) {
    ev.returnValue = false;
    remote.getCurrentWindow().hide();
}

remote.getCurrentWindow().on('minimize', (ev: Event) => {
    hideBehaviour(ev);
})

window.onbeforeunload = (ev: Event) => {
    if (preventUnload) {
        var isqutting = intoCpsAppIns.isquitting;
        if (isqutting || killWindow) {
            if (globalChild) {
                ev.returnValue = false;
                killCoeCloseWindow();
            }
        }
        else
        {
            hideBehaviour(ev)
        }
    }
}
ipcRenderer.on("kill", (event, message) => {
    killWindow = true;
    window.close();
});

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

function killCoeCloseWindow() {
    if (globalChild) {
        var kill = require('tree-kill');
        kill(globalChild.pid, 'SIGKILL', (err: any) => {
            if (err) {
                remote.dialog.showErrorBox("Failed to close COE", "It was not possible to close the COE. Pid: " + globalChild.pid)
            }
            else {
                globalChild = null;
            }
            preventUnload = false;
            window.close();
        });
    }
}

function coeClose(){
    window.close();
}

function clearOutput() {
    let div = document.getElementById("coe-console-output");
    while (div != null && div.hasChildNodes()) {
        div.removeChild(div.firstChild);
    }
}
function launchCoe() {
    var spawn = child_process.spawn;

    let installDir = intoCpsAppIns.getSettings().getValue(SettingKeys.INSTALL_TMP_DIR);
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
    globalChild = child;

    let root = document.getElementById("coe-console")
    while (root.hasChildNodes()) {
        root.removeChild(root.firstChild);
    }

    let div = document.createElement("div");
    div.id = "coe-console-output";
    let panel = createPanel("Console", div);
    root.appendChild(panel);
    let mLaunch = document.createElement("span");
    mLaunch.innerHTML = "Terminal args: java -jar " + coePath + "<br/>";
    div.appendChild(mLaunch);

    child.stdout.on('data', function (data: any) {
        // console.log('stdout: ' + data);
        //Here is where the output goes
        let dd = (data + "").split("\n");

        dd.forEach(line => {
            if (line.trim().length != 0) {
                let m = document.createElement("span");
                m.innerHTML = line + "<br/>";
                if (line.indexOf("ERROR") > -1)
                    m.style.color = "rgb(255, 0, 0)";
                if (line.indexOf("WARN") > -1)
                    m.style.color = "rgb(255, 165, 0)";
                if (line.indexOf("DEBUG") > -1)
                    m.style.color = "rgb(0, 0, 255)";
                if (line.indexOf("TRACE") > -1)
                    m.style.color = "rgb(128,128,128)";

                div.appendChild(m);
            }
        });


        if (div.childElementCount > 600)
            while (div.childElementCount > 500 && div.hasChildNodes()) {
                div.removeChild(div.firstChild);
            }
        window.scrollTo(0, document.body.scrollHeight);
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


