import {IntoCpsApp} from "../IntoCpsApp"
import {SettingKeys} from "../settings/SettingKeys";
import {SourceDom} from "../sourceDom"
import {IViewController} from "../iViewController"

import Path = require('path');

export class DseController extends IViewController {

    private jsonPath: String;

    public initialize(source:SourceDom) {
        IntoCpsApp.setTopName("Design Space Exploration");
        this.jsonPath = source.getPath();
    }

    constructor(div:HTMLDivElement){
      super(div);
    }

    public launchDse(){
        var spawn = require('child_process').spawn;
        let installDir = IntoCpsApp.getInstance().getSettings().getValue(SettingKeys.INSTALL_TMP_DIR);
        let scriptFile = Path.join(installDir, "dse", "test.py"); 
        var child = spawn("python", [scriptFile, this.jsonPath], {
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
