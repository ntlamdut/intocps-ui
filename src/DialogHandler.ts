///<reference path="../typings/browser/ambient/github-electron/index.d.ts"/>
///<reference path="../typings/browser/ambient/node/index.d.ts"/>
import IntoCpsApp from  "./IntoCpsApp";
import {SettingKeys} from "./settings/SettingKeys"

export default class DialogHandler {

    doAction: (arg: any) => void;
    htmlPath: string;
    ipcDoActionEventName: string;
    ipcOpenEventName: string;
    windowWidth: number;
    windowHeight: number;

    externalUrl: boolean = false;

    win: any = null;

    constructor(htmlPath: string, windowWidth: number,
        windowHeight: number, ipcOpenEventName: string, ipcDoActionEventName: string, doAction: (arg: any) => void) {
        this.htmlPath = htmlPath;
        this.windowWidth = windowWidth;
        this.windowHeight = windowHeight;
        this.ipcDoActionEventName = ipcDoActionEventName;
        this.doAction = doAction;
        this.ipcOpenEventName = ipcOpenEventName;
    }

    public install() {

        if (this.ipcOpenEventName != null) {

            IntoCpsApp.getInstance().on(this.ipcOpenEventName, (path: any) => {
                console.log(path);  // prints "ping"
                //event.sender.send('asynchronous-reply', 'pong');
                this.openWindow();
            });
        }

        if (this.ipcDoActionEventName != null) {
            IntoCpsApp.getInstance().on(this.ipcDoActionEventName, (arg: any) => {
                this.doAction(arg);
                this.win.close();
            });
        }

    }

    public openWindow(data:string = '', showWindow:boolean = true) {

        const electron = require('electron');

        // Module to create native browser window.
        const BrowserWindow = electron.remote.BrowserWindow;

        this.win = new BrowserWindow({ width: this.windowWidth, height: this.windowHeight, show: showWindow });
        if(!IntoCpsApp.getInstance().getSettings().getSetting(SettingKeys.DEVELOPMENT_MODE) && this.win.setMenu)
            this.win.setMenu(null);

        // Open the DevTools.
        //this.win.webContents.openDevTools();

        this.win.on('closed', function () {
            this.win = null;
        });

        if (this.externalUrl) {
            this.win.loadURL(this.htmlPath);
        } else {
            this.win.loadURL(`file://${__dirname}/${this.htmlPath}?data=${data}`);
        }
        return this.win;
    }

}
export {DialogHandler}

