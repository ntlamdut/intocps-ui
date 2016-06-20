import {IntoCpsApp} from "../IntoCpsApp"
import {SettingKeys} from "../settings/SettingKeys";
import {SourceDom} from "../sourceDom"
import {IViewController} from "../iViewController"

import Path = require('path');

export class DseController extends IViewController {

    private doNotPressButton: HTMLButtonElement;

    public initialize() {
        IntoCpsApp.setTopName("Design Stace Exploration");
    }

    constructor(div:HTMLDivElement){
      super(div);
    }

    public load(source:SourceDom){
      // process configuration source here
      // as a first step, we recommend extracting the JSON data into a
      // type-safe map
      //var divProgress = <HTMLInputElement>document.getElementById("blah");
      //divProgress.innerText = "Coming even sooner than you think";
    }

    public launchDse(){
        var spawn = require('child_process').spawn;
        let installDir = IntoCpsApp.getInstance().getSettings().getValue(SettingKeys.INSTALL_TMP_DIR);
        let scriptFile = Path.join(installDir, "dse", "scripts", "test.py"); 
        var child = spawn("python", [scriptFile, "hello", "world"], {
            detached: true,
            shell: false,
            // cwd: childCwd
        });
        child.unref();

        child.stdout.on('data', function (data: any) {
            console.log('dse/stdout: ' + data);
            var status = <HTMLInputElement>document.getElementById("dse-status");
            let m = document.createElement("span");
            m.innerText = data + "";
            status .appendChild(m);          
        });
        child.stderr.on('data', function (data: any) {
            console.log('dse/stderr: ' + data);
            var status = <HTMLInputElement>document.getElementById("dse-status");
            let m = document.createElement("span");
            m.innerText = data + "";
            status.appendChild(m);  
        });
    }
}
