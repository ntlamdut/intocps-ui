import { IntoCpsApp } from "./IntoCpsApp";
import { CoeProcess } from "./coe-server-status/CoeProcess"

export class CoeServerStatusUiController {

    private outputDiv: HTMLDivElement = null; //coe-console-output

    activeDiv: HTMLDivElement;
    errorPrefix = ".";
    coeStatusRunning = false;
    bottomElement: any = null;
    isSubscribed = false;
    buffer: DocumentFragment = new DocumentFragment();
    coeLogStartLine: string;
    coeLogStartLineIsSet = false;

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
        let endsWithNewline: boolean = data.endsWith("\n");
        let dd = data.split("\n");

        dd.forEach((line, idx, array) => {
            if (line.trim().length != 0) {
                if (idx === array.length - 1 && endsWithNewline === false) {
                    this.coeLogStartLine = line;
                    this.coeLogStartLineIsSet = true;
                }
                else {
                    let m = document.createElement("span");
                    if (this.coeLogStartLineIsSet) {
                        if (idx === 0) { m.innerHTML = this.coeLogStartLine; }
                        else {
                            this.coeLogStartLineIsSet = false;
                        }
                    }
                    m.innerHTML = m.innerHTML.concat(`${line} <br/>`);
                    if (line.indexOf("ERROR") > -1 || line.indexOf(this.errorPrefix) == 0)
                        m.style.color = "rgb(255, 0, 0)";
                    if (line.indexOf("WARN") > -1)
                        m.style.color = "rgb(255, 165, 0)";
                    if (line.indexOf("DEBUG") > -1)
                        m.style.color = "rgb(0, 0, 255)";
                    if (line.indexOf("TRACE") > -1 || line.indexOf("(resumed)") == 0 || line.indexOf("( truncated...)") == 0)
                        m.style.color = "rgb(128,128,128)";
                    this.buffer.appendChild(m);
                }
            }
        });

        this.outputDiv.appendChild(this.buffer);
        this.buffer = new DocumentFragment();
    }

    private setStatusIcons() {
        var coe = IntoCpsApp.getInstance().getCoeProcess();
        var ss = <HTMLSpanElement>document.getElementById("stream-status");

        if (coe.isLogRedirectActive() && coe.isRunning()) {
            ss.className = "glyphicon glyphicon-link";
        } else {
            ss.className = "glyphicon glyphicon-remove";
        }

        var os = <HTMLSpanElement>document.getElementById("online-status");

        if (coe.isRunning()) {
            os.className = "glyphicon glyphicon-ok";
        } else {
            os.className = "glyphicon glyphicon-remove";
        }

        var btnLaunch = <HTMLButtonElement>document.getElementById("coe-btn-launch");
        btnLaunch.disabled = coe.isRunning();
        var btnStop = <HTMLButtonElement>document.getElementById("coe-btn-stop");
        btnStop.disabled = !coe.isRunning();
    }

    consoleAutoScroll() {
        let div = this.outputDiv;
        if (!$(div).is(":visible"))
            return;
        if (this.bottomElement == div.lastChild || div.lastChild == null)
            return
        this.bottomElement = div.lastChild;
        (<HTMLSpanElement>div.lastChild).scrollIntoView();
    }

    protected truncateVisibleLog() {
        let maxLines = 4000
        if (this.outputDiv.childElementCount > maxLines)
            while (this.outputDiv.childElementCount > maxLines && this.outputDiv.hasChildNodes()) {
                this.outputDiv.removeChild(this.outputDiv.firstChild);
            }
    }

    public async bind() {
        if (this.isSubscribed)
            return;

        var coe = IntoCpsApp.getInstance().getCoeProcess();
        this.errorPrefix = coe.getErrorLogLinePrefix();
        coe.subscribe((line: any) => { this.processOutput(line) })
        this.isSubscribed = true;
        this.setStatusIcons();

        if (!this.coeStatusRunning) {
            window.setInterval(() => { this.setStatusIcons(); this.truncateVisibleLog() }, 3000);
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

    public async bind() {
        if (this.isSubscribed)
            return;
        var coe = IntoCpsApp.getInstance().getCoeProcess();
        coe.subscribeLog4J((data: any) => { this.processOutput(data) });
        window.setInterval(() => { this.truncateVisibleLog() }, 3000);
        this.isSubscribed = true;
        window.setInterval(() => { this.consoleAutoScroll() }, 800);
    }
}






















