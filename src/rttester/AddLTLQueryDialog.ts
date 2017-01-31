
import fs = require("fs");
import Path = require("path");

export function display(dir: string): void {
    let hAddButton: HTMLButtonElement = <HTMLButtonElement>document.getElementById("modalAdd");
    let hQueryName: HTMLInputElement = <HTMLInputElement>document.getElementById("QueryName");
    let hModalFail: HTMLLabelElement = <HTMLLabelElement>document.getElementById("modalFail");

    $('#modalDialog').on('shown.bs.modal', ()=> hQueryName.focus());
    hQueryName.addEventListener("input", () => {
        if (hQueryName.value == "") {
            hModalFail.innerText = "";
            hModalFail.style.display = "none";
            hAddButton.disabled = true;
        } else {
            let path = Path.join(dir, hQueryName.value);
            fs.stat(path, (err: any, stats: fs.Stats) => {
                if (!err) {
                    hModalFail.innerText = "Invalid name for LTL query.";
                    hAddButton.disabled = true;
                    hModalFail.style.display = "block";
                } else {
                    hModalFail.innerText = "";
                    hAddButton.disabled = false;
                    hModalFail.style.display = "none";
                }
            });
        }
    });
    let create = () => {
        let ltlDir = Path.join(dir, hQueryName.value);
        let err = fs.mkdirSync(ltlDir);
        if (err) {
            hModalFail.innerText = "Error creating folder '" + ltlDir + "'.";
            hModalFail.style.display = "block";
            return;
        }
        // Add empty LTL formula.
        let jsonObject = {
            BMCSteps: 50,
            ltlFormula: ""
        };
        let queryFileName = Path.join(ltlDir, "query.json");
        err = fs.writeFileSync(queryFileName, JSON.stringify(jsonObject, null, 4));
        if (err) {
            hModalFail.innerText = "Error writing query file '" + queryFileName + "'.";
            hModalFail.style.display = "block";
            return;
        }
        (<any>$("#modalDialog")).modal("hide");
    };
    hAddButton.addEventListener("click", (event: Event) => create());
    hQueryName.addEventListener("keydown", (e) => {
        // enter key
        if (e.keyCode == 13 && !hAddButton.disabled) {
            create();
        }
    });
}

