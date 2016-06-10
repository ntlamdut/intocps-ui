import * as Main from  "./Settings"
import * as IntoCpsApp from  "../IntoCpsApp"
import {SettingKeys} from "./SettingKeys";
import {TextInputNonLoad, TextInputIds} from "../coe/components/text-input-non-load";
import {Settings} from "./settings";
import {Component} from "../multimodel/components/component";

class SettingsView {
    private keys: { [key: string]: any };
    private idCounter: number = 0;
    private settings: Settings;
    private settingsView: HTMLElement;
    constructor() {
        this.settings = IntoCpsApp.IntoCpsApp.getInstance().getSettings();
        this.settingsView = document.getElementById("settings-div");
        Object.keys(SettingKeys).forEach(k => {
            if(k != "DEFAULT_VALUES"){
                this.addSetting((<any>SettingKeys)[k]);
            }
        });
    }

    private getNextId(id: string) {
        return id + this.idCounter++;
    }

    private addSetting(settingName: string) {
        let callback = (value: any) => {
            this.settings.setValue(settingName, value);
            return true;
        }
        //Get type of value
        let value = this.settings.getValue(settingName);
        let self = this;
        if (typeof (value) === "boolean") {
            $("<div>").load("checkbox-setting.html", function (event: JQueryEventObject) {
                let html = <HTMLElement>(<HTMLDivElement>this).firstChild;
                let label = html.querySelector("label");
                label.textContent = settingName;
                let chkBox = <HTMLInputElement>html.querySelector("#chkBox");
                Component.changeId(chkBox, self.getNextId("settings-chkBox"));
                chkBox.checked = value;
                chkBox.onclick = (event: MouseEvent) => {
                    callback(chkBox.checked);
                }
                self.settingsView.appendChild(html);
            });
        }
        else {
            $("<div>").load("text-setting.html", function (event: JQueryEventObject) {
                let html = <HTMLElement>(<HTMLDivElement>this).firstChild;
                let label = html.querySelector("label");
                label.textContent = settingName;
                let ids = new TextInputIds();
                ids.textId = Component.changeId(<HTMLElement>html.querySelector("#text"), self.getNextId("settings-text"));
                ids.cancelButton = Component.changeId(<HTMLElement>html.querySelector("#cancelButton"), self.getNextId("settings-cancelButton"));
                ids.editOkButton = Component.changeId(<HTMLElement>html.querySelector("#editOkButton"), self.getNextId("settings-editOkButton"));

                let textInput = new TextInputNonLoad(html, value, callback.bind(self), ids);
                self.settingsView.appendChild(html);
            });
        }
    }

    public save() {
        this.settings.save();
        let remote = require("electron").remote;
        let dialog = remote.dialog;
        dialog.showMessageBox({ type: 'warning', buttons: ["ok"], message: "Please restart the application for all settings to take effect." }, function (button: any) {
            window.top.close();
        });

        return false;
    }
}

let view = new SettingsView();
