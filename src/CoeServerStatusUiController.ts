import { IntoCpsApp } from "./IntoCpsApp";
import { CoeProcess } from "./coe-server-status/CoeProcess"

export class CoeServerStatusUiController {

    private outputDiv: HTMLDivElement = null; //coe-console-output

    activeDiv: HTMLDivElement;
    errorPrefix = ".";
    coeStatusRunning = false;
    bottomElement: any = null;
    isSubscribed = false;

    constructor(outputDiv: HTMLDivElement) {
        this.outputDiv = outputDiv;

    }

    public clearOutput() {
        let div = this.outputDiv;
        while (div != null && div.hasChildNodes()) {
            div.removeChild(div.firstChild);
        }
    }

    protected processOutput(data: string) {

        let div = this.outputDiv;
        let dd = (data + "").split("\n");
        var lastElement: HTMLSpanElement = null;

        dd.forEach(line => {
            if (line.trim().length != 0) {
                let m = document.createElement("span");
                m.innerHTML = line + "<br/>";
                if (line.indexOf("ERROR") > -1 || line.indexOf(this.errorPrefix) == 0)
                    m.style.color = "rgb(255, 0, 0)";
                if (line.indexOf("WARN") > -1)
                    m.style.color = "rgb(255, 165, 0)";
                if (line.indexOf("DEBUG") > -1)
                    m.style.color = "rgb(0, 0, 255)";
                if (line.indexOf("TRACE") > -1 || line.indexOf("(resumed)") == 0)
                    m.style.color = "rgb(128,128,128)";

                div.appendChild(m);
                lastElement = m;
            }
        });

        let maxLines = 1000
        if (div.childElementCount > maxLines)
            while (div.childElementCount > maxLines && div.hasChildNodes()) {
                div.removeChild(div.firstChild);
            }
    }

    private setStatusIcons() {
        var coe = IntoCpsApp.getInstance().getCoeProcess();

        if (coe.isLogRedirectActive() && coe.isRunning()) {

            var sp = <HTMLSpanElement>document.getElementById("stream-status");
            sp.className = "glyphicon glyphicon-link";
        } else {
            var sp = <HTMLSpanElement>document.getElementById("stream-status");
            sp.className = "glyphicon glyphicon-remove";
        }

        if (coe.isRunning()) {
            var sp = <HTMLSpanElement>document.getElementById("online-status");
            sp.className = "glyphicon glyphicon-ok";
        } else {
            var sp = <HTMLSpanElement>document.getElementById("online-status");
            sp.className = "glyphicon glyphicon-remove";
        }
    }

    consoleAutoScroll() {
        let div = this.outputDiv;
        if (!$(div).is(":visible"))
            return;
        if (this.bottomElement == div.lastChild)
            return
        this.bottomElement = div.lastChild;
        (<HTMLSpanElement>div.lastChild).scrollIntoView();
    }

    public bind() {
        if (this.isSubscribed)
            return;



        var coe = IntoCpsApp.getInstance().getCoeProcess();
        this.errorPrefix = coe.getErrorLogLinePrefix();
        coe.subscribe((line: any) => { this.processOutput(line) })
        this.isSubscribed = true;
        this.setStatusIcons();

        if (!this.coeStatusRunning) {
            window.setInterval(this.setStatusIcons, 3000);
            window.setInterval(() => { this.consoleAutoScroll() }, 800);
            this.coeStatusRunning = true;
        }
    }

    public launchCoe() {

        this.activeDiv = this.outputDiv;
        while (this.activeDiv.hasChildNodes()) {
            this.activeDiv.removeChild(this.activeDiv.firstChild);
        }

        var coe = IntoCpsApp.getInstance().getCoeProcess();
        let mLaunch = document.createElement("span");
        mLaunch.innerHTML = "Terminal args: java -jar " + coe.getCoePath() + "<br/>";

        this.activeDiv.appendChild(mLaunch);

        this.bind();

        
        if (!coe.isRunning()) {
            coe.start();
        }
    }

    public stopCoe() {
        var coe = IntoCpsApp.getInstance().getCoeProcess();
        if (coe.isRunning()) {
            coe.stop();
        }
    }

}

export class CoeLogUiController extends CoeServerStatusUiController {

    public bind() {
        if (this.isSubscribed)
            return;
        var coe = IntoCpsApp.getInstance().getCoeProcess();
        coe.subscribeLog4J((line: any) => { this.processOutput(line) })
        this.isSubscribed = true;
        window.setInterval(() => { this.consoleAutoScroll() }, 800);
    }
}





















