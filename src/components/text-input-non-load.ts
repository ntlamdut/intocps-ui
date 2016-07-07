import {TextInputState} from "./text-input";
import {glyphiconEditButton} from "./types";
import {Component} from "./component";

export class TextInputIds {
    textId: string;
    editOkButton: string;
    cancelButton: string;
    constructor(textId?: string, editOkButton?: string, cancelButton?: string) {
        if (textId == null && editOkButton == null && cancelButton == null) {
            this.textId = "text";
            this.editOkButton = "editOkButton";
            this.cancelButton = "cancelButton";
        }
        else {
            this.textId = textId;
            this.editOkButton = editOkButton;
            this.cancelButton = cancelButton;
        }
    }

}

export class TextInputNonLoad {
    private container: HTMLElement;
    private textField: HTMLInputElement;
    private editOkButton: HTMLButtonElement;
    private editOkButtonGlyphicon: HTMLSpanElement;
    private cancelButton: HTMLButtonElement;
    private state: TextInputState;
    private text: string;
    private keyChanged: (text: string) => boolean;
    private ids: TextInputIds;
    constructor(container: HTMLElement, text: string, keyChanged: (text: string) => boolean, ids: TextInputIds, state?: TextInputState) {
        this.text = text;
        this.container = container;
        this.keyChanged = keyChanged;
        this.ids = ids;
        if (ids.cancelButton)
            this.initializeUI(state == null ? TextInputState.OK : state);
    }

    getText() {
        return this.text;
    }

    private initializeUI(state: TextInputState) {
        this.textField = <HTMLInputElement>this.container.querySelector("#" + this.ids.textId);
        this.editOkButton = <HTMLButtonElement>this.container.querySelector("#" + this.ids.editOkButton);
        this.editOkButton.onclick = this.okEditClicked.bind(this);
        this.editOkButtonGlyphicon = <HTMLSpanElement>this.editOkButton.querySelector("span");
        this.cancelButton = <HTMLButtonElement>this.container.querySelector("#" + this.ids.cancelButton);
        this.cancelButton.onclick = this.cancelClicked.bind(this);
        this.setTextUI(this.text);
        this.setState(state);
    }

    private setTextUI(text: string) {
        this.textField.value = text;
    }

    private getTextUI() {
        return this.textField.value;
    }

    private setState(state: TextInputState) {
        this.state = state;
        if (state == TextInputState.OK) {
            this.setButtonGlyphicon(this.editOkButtonGlyphicon, "glyphicon-pencil", "glyphicon-ok");
            this.textField.readOnly = true;
            Component.hide(this.cancelButton);
        }
        else if (state == TextInputState.EDIT) {
            this.setButtonGlyphicon(this.editOkButtonGlyphicon, "glyphicon-ok", "glyphicon-pencil");
            this.textField.readOnly = false;
            Component.show(this.cancelButton);
        }
    }

    hideElement(element: HTMLElement) {
        if (!element.classList.contains("hidden")) {
            element.classList.add("hidden");
        }
    }

    showElement(element: HTMLElement) {
        if (element.classList.contains("hidden")) {
            element.classList.remove("hidden");
        }
    }

    private setButtonGlyphicon(iconElement: HTMLElement, classToAdd: glyphiconEditButton, classToRemove: glyphiconEditButton) {
        if (iconElement.classList.contains(classToRemove)) {
            iconElement.classList.remove(classToRemove);
        }
        if (!iconElement.classList.contains(classToAdd))
        { iconElement.classList.add(classToAdd); }
    }
    private okEditClicked(event?: MouseEvent) {
        if (this.state == TextInputState.OK) {
            this.setState(TextInputState.EDIT);
        }
        else if (this.state == TextInputState.EDIT) {
            let previousText = this.text;
            this.text = this.getTextUI();
            if (this.keyChanged(this.getTextUI())) {
                this.setState(TextInputState.OK);
            }
            else {
                this.setTextUI(previousText);
                this.text = previousText;
                alert("Invalid");
            }
        }
    }

    private cancelClicked(event: MouseEvent) {
        if (this.keyChanged(this.text)) {
            this.setTextUI(this.text);
            this.okEditClicked();
        }
        else {
            alert("The key already exists");
        }

    }

    getContainer() {
        return this.container;
    }


}
