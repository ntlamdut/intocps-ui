import {IntoCpsApp} from  "../IntoCpsApp"
import {SettingKeys} from "../settings/SettingKeys";
import * as ProjectFetcher from "../proj/ProjectFetcher"

import Path = require('path');
import fs = require('fs');

import * as http from "http";
let request = require("request");


function launchProjectExplorer() {
    let remote = require("electron").remote;
    let dialog = remote.dialog;
    let dialogResult: string[] = dialog.showOpenDialog({ properties: ["openDirectory", "createDirectory"] });
    if (dialogResult != undefined) {

        var p: HTMLInputElement = <HTMLInputElement>document.getElementById("projectRootPathText");
        p.value = dialogResult[0];
        //       this.app.createProject("my project",this.projectRootPath.value);
    }


}

window.onload = function () {

    var dest: HTMLInputElement = <HTMLInputElement>document.getElementById("projectRootPathText");
    dest.value = IntoCpsApp.getInstance().getSettings().getValue(SettingKeys.DEFAULT_PROJECTS_FOLDER_PATH);

    fetchExamples(IntoCpsApp.getInstance().getSettings().getValue(SettingKeys.EXAMPLE_REPO)).then(json => {

        let ul = document.createElement("ul");
        ul.className = "list-group";

        let div: HTMLInputElement = <HTMLInputElement>document.getElementById("examples-div");
        div.appendChild(ul);

        json.examples.forEach((ex: any) => {
            let exDiv = document.createElement("li");
            exDiv.className = "list-group-item";
            exDiv.innerText = ex.name;
            exDiv.onclick = function () {
                var p: HTMLInputElement = <HTMLInputElement>document.getElementById("basic-url");
                p.value = ex.git;
                activateListItem(exDiv);
            };
            ul.appendChild(exDiv);
        });
    });
};

function fetchExamples(url: string) {
    return new Promise<any>((resolve, reject) => {
        // let data = new Stream<string>();
        request({ url: url, json: true }, function (
            error: Error, response: http.IncomingMessage, body: any) {
            if (!error && response.statusCode == 200) {
                resolve(body);
            } else {
                reject(error);
            }
        });
    });
}

function activateListItem(elem: any) {
    // get all 'a' elements
    var a = document.getElementsByTagName('li');
    // loop through all 'a' elements
    var i: number = 0;
    for (i = 0; i < a.length; i++) {
        // Remove the class 'active' if it exists
        a[i].classList.remove('list-group-item-info')
    }
    // add 'active' classs to the element that was clicked
    elem.classList.add('list-group-item-info');
}



function examples_open() {

    var p: HTMLInputElement = <HTMLInputElement>document.getElementById("basic-url");
    var dest: HTMLInputElement = <HTMLInputElement>document.getElementById("projectRootPathText");

    document.getElementById('openSpinner').style.display = "block";
    document.getElementById('container').style.display = "none";

    var progress = document.getElementById('progress');
    var progressBar = document.getElementById('progress-bar');

    ProjectFetcher.fetchProjectThroughGit(p.value, dest.value, (output:string) => {
        var percentage = ProjectFetcher.parsePercentage(output);

        if (percentage) {
            progressBar.style.width = percentage;
            progressBar.innerHTML = percentage;
        }

        progress.innerHTML = output.split("\n").pop();
    })
        .then(code => window.top.close());
}
