import IntoCpsApp from  "./IntoCpsApp";
import {SettingKeys} from "./settings/SettingKeys"
import {remote} from "electron"
export default class DialogHandler {

    doAction: (arg: any) => void;
    htmlPath: string;
    ipcDoActionEventName: string;
    ipcOpenEventName: string;
    windowWidth: number;
    windowHeight: number;

    externalUrl: boolean = false;

    win: Electron.BrowserWindow = null;

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

    public openWindow(data:string = '', showWindow:boolean = true) : Electron.BrowserWindow {
        let self = this;
        this.win = new remote.BrowserWindow({ width: this.windowWidth, height: this.windowHeight, show: showWindow });
        if(!IntoCpsApp.getInstance().getSettings().getSetting(SettingKeys.DEVELOPMENT_MODE) && this.win.setMenu)
            this.win.setMenu(null);

        // Open the DevTools.
        //this.win.webContents.openDevTools();
        window.onbeforeunload = (ev) => {if(this.win) this.win.removeAllListeners();}

        this.win.on('closed', function () {
            self.win.removeAllListeners();
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

