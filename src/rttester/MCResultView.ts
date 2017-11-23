
import { ViewController } from "../iViewController";
import { IntoCpsApp } from "../IntoCpsApp";
import Path = require("path");
import { RTTester } from "../rttester/RTTester";
import fs = require("fs");


export class MCResultView extends ViewController {

    hReport: HTMLDivElement;
    rtt_testcontext: string;
    ltl_name: string;

    constructor(protected viewDiv: HTMLDivElement, resultFilePath: string) {
        super(viewDiv);
        this.rtt_testcontext = RTTester.getProjectOfFile(resultFilePath);
        this.ltl_name = Path.dirname(RTTester.getRelativePathInProject(resultFilePath));
        IntoCpsApp.setTopName(RTTester.getRelativePathInProject(resultFilePath));
        this.hReport = <HTMLDivElement>document.getElementById("report");
        let f: HTMLIFrameElement = document.createElement("iframe");
        f.src = resultFilePath;
        f.style.width = "100%";
        f.style.height = "100%";
        this.hReport.appendChild(f);
        {
            // Only show commit button if requirements are linked.
            let ltlQueryFileName = Path.join(Path.dirname(resultFilePath), "query.json");
            let data = fs.readFileSync(ltlQueryFileName, "utf-8");
            let json = JSON.parse(data);
            console.log(json["RequirementsToLink"]);
            if (json["RequirementsToLink"].length == 0) {
                let hCommitPanel = <HTMLDivElement>document.getElementById("commitPanel");
                hCommitPanel.style.display = "none";
            }
        }
    }

    commit(): void {
        RTTester.queueEvent("Run-MC-Query", this.rtt_testcontext, this.ltl_name);
        RTTester.reportEvents(this.rtt_testcontext);
    }

}

