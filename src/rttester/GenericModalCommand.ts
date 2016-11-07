

export class GenericModalCommand {
    hAbortButton: HTMLButtonElement;
    hCloseButton: HTMLButtonElement;
    hOutputText: HTMLTextAreaElement;

    constructor() { }
    load(onLoad: () => void) {
        let self = this;
        $("#modalDialog").load("rttester/GenericModalCommand.html", (event: JQueryEventObject) => {
            self.hAbortButton = <HTMLButtonElement>document.getElementById("modalAbort");
            self.hCloseButton = <HTMLButtonElement>document.getElementById("modalClose");
            self.hOutputText = <HTMLTextAreaElement>document.getElementById("modalOutputText");
            onLoad();
            (<any>$("#modalDialog")).modal({ keyboard: false, backdrop: false });
        });
    }
    setTitle(title: string) {
        document.getElementById("modalTitle").innerText = title;
    }
    appendLog(s: string) {
        let hOutputText: HTMLTextAreaElement = <HTMLTextAreaElement>document.getElementById("modalOutputText");
        hOutputText.textContent += s + "\n";
        hOutputText.scrollTop = hOutputText.scrollHeight;
    }
    displayTermination(success: boolean) {
        document.getElementById("modalRUN").style.display = "none";
        document.getElementById(success ? "modalFAIL" : "modalOK").style.display = "none";
        document.getElementById(success ? "modalOK" : "modalFAIL").style.display = "block";
        this.hCloseButton.style.display = "initial";
        this.hAbortButton.style.display = "none";
    }
    setAbortCallback(abort: (c: GenericModalCommand) => void) {
        let self = this;
        this.hAbortButton.style.display = "initial";
        this.hAbortButton.onclick = () => {
            abort(self);
        };
    }
    allowClose() {
        this.hCloseButton.style.display = "initial";
    }
    run(cmd: (c: GenericModalCommand) => void) {
        let self = this;
        self.hCloseButton.style.display = "none";
        cmd(self);
    }
}

export function load(title: string, onRun: (cmd: GenericModalCommand) => void): void {
    let cmd = new GenericModalCommand();
    cmd.load(() => {
        cmd.setTitle(title);
        cmd.run(onRun)
    });
}

export function runCommand(cmd: any): void {
    if (cmd.arguments == undefined)
        cmd.arguments = [];
    if (cmd.background == undefined)
        cmd.background = false;
    if (cmd.options == undefined)
        cmd.options = {};
    if (cmd.options.env == undefined)
        cmd.options.env = process.env;

    load(cmd.title, (c: GenericModalCommand) => {
        const spawn = require("child_process").spawn;
        const child = spawn(cmd.command, cmd.arguments, cmd.options);
        child.stdout.on("data", c.appendLog.bind(c));
        child.stderr.on("data", c.appendLog.bind(c));
        child.on("exit", (code: number) => {
            c.displayTermination(code == 0);
            if (code == 0 && cmd.onSuccess)
                cmd.onSuccess(c);
            if (code == 1 && cmd.onFailure)
                cmd.onFailure(c);
        });
        c.setAbortCallback(() => { child.kill(); });
        if (cmd.background) {
            c.allowClose();
        }
    });
}

