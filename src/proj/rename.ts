

import { IntoCpsApp } from "../IntoCpsApp";
import Path = require("path");


function gup(name: any, url: any) {
    if (!url) url = location.href;
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regexS = "[\\?&]" + name + "=([^&#]*)";
    var regex = new RegExp(regexS);
    var results = regex.exec(url);
    return results == null ? null : results[1];
}


window.onload = function () {
    var n: HTMLInputElement = <HTMLInputElement>document.getElementById("name");
    n.value = Path.basename(gup("data", undefined));
};

function rename() {

    var n: HTMLInputElement = <HTMLInputElement>document.getElementById("newName");


    let oldPath = decodeURIComponent(gup("data", undefined));
    let newPath = Path.join(oldPath, '..', n.value)
    console.log("Renaming from " + oldPath + " to " + newPath);

    var fs = require('fs-extra');

    fs.move(oldPath, newPath, function (err: any) {
        if (err) {
            console.error("Move faild " + oldPath + " -> "+newPath);
            return console.error(err);
        }
        console.error("Move completed " + oldPath + " -> "+newPath);
        window.top.close();
    })
}

