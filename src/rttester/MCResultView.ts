
import { ViewController } from "../iViewController";
import { IntoCpsApp } from "../IntoCpsApp";
import Path = require("path");
import { RTTester } from "../rttester/RTTester";


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
    }

    commit(): void {
        RTTester.queueEvent("Run-MC-Query", this.rtt_testcontext, this.ltl_name);
        RTTester.reportEvents(this.rtt_testcontext);
    }

}

