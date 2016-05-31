
export function initialize(cmd: any): void {
    if (cmd.arguments == undefined)
        cmd.arguments = [];
    if (cmd.background == undefined)
        cmd.background = false;
    if (cmd.options == undefined)
        cmd.options = {};
    if (cmd.options.env == undefined)
        cmd.options.env = process.env;

    document.getElementById("modalTitle").innerText = cmd.title;
    var hRunButton: HTMLButtonElement = <HTMLButtonElement>document.getElementById("modalRun");
    var hAbortButton: HTMLButtonElement = <HTMLButtonElement>document.getElementById("modalAbort");
    var hCloseButton: HTMLButtonElement = <HTMLButtonElement>document.getElementById("modalClose");
    var hOutputText: HTMLTextAreaElement = <HTMLTextAreaElement>document.getElementById("modalOutputText");

    hRunButton.addEventListener("click", function (event: Event) {
        document.getElementById("modalOutput").style.display = "initial";
        hRunButton.style.display = 'none';
        if (!cmd.background) {
            hCloseButton.style.display = 'none';
        }
        const spawn = require('child_process').spawn;
        console.log("starting " + cmd.command + " with arguments " + cmd.arguments);
        const child = spawn(cmd.command, cmd.arguments, cmd.options);
        child.stdout.on('data', (data: string) => {
            hOutputText.textContent += data + "\n";
            hOutputText.scrollTop = hOutputText.scrollHeight;
        });
        child.stderr.on('data', (data: string) => {
            hOutputText.textContent += data + "\n";
            hOutputText.scrollTop = hOutputText.scrollHeight;
        });
        child.on('close', (code: number) => {
            document.getElementById("modalRUN").style.display = "none";
            document.getElementById(code == 0 ? "modalOK" : "modalFAIL").style.display = "block";
            hCloseButton.style.display = 'initial';
            hAbortButton.style.display = 'none';
        });
        hAbortButton.addEventListener("click", function (event: Event) {
            child.kill();
        });
        if (!cmd.background) {
            hAbortButton.style.display = 'initial';
        }
    });
}

