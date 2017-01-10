const electron = require('electron');
const Tray = electron.remote.Tray;
const Menu = electron.remote.Menu;
const fs = require('fs');
const path = require('path');
var settings = require("./settings/settings").default;
var SettingKeys = require("./settings/SettingKeys");
var IntoCpsApp = require("./IntoCpsApp").default;
import * as SystemUtil from "./SystemUtil";

var DialogHandler = require("./DialogHandler").default;
var IntoCpsAppEvents = require("./IntoCpsAppEvents");
var ProjectFetcher = require("./proj/ProjectFetcher");

const intoCpsApp = IntoCpsApp.getInstance();


let createProjectHandler = new DialogHandler("proj/new-project.html", 300, 200, IntoCpsAppEvents.OPEN_CREATE_PROJECT_WINDOW, "new-project-create", (arg: any) => {
  intoCpsApp.createProject(arg.name, arg.path);
});

let openProjectHandler = new DialogHandler("proj/open-project.html", 300, 200, IntoCpsAppEvents.OPEN_OPEN_PROJECT_WINDOW, "open-project-open", (arg: any) => {
  intoCpsApp.setActiveProject(intoCpsApp.loadProject(arg.path));
});

let openDownloadManagerHandler = new DialogHandler("downloadManager/DownloadManager.html", 500, 500, null, null, null);
export let coeServerStatusHandler = new DialogHandler("coe-server-status/CoeServerStatus.html", 500, 500, null, null, null);
let fmuBuilderHandler = new DialogHandler("http://sweng.au.dk/fmubuilder/", 500, 500, null, null, null);
fmuBuilderHandler.externalUrl = true;
let reportIssueHandler = new DialogHandler("https://github.com/into-cps/intocps-ui/issues/new", 600, 600, null, null, null);
reportIssueHandler.externalUrl = true;


let fetchProjectFromGitHandler = new DialogHandler("proj/ProjectFetcher.html", 500, 300, null, null, null);
let openExamplesFromGitHandler = new DialogHandler("examples/examples.html", 500, 400, null, null, null);
let openSettingsHandler = new DialogHandler("settings/settings.html", 500, 600, null, null, null);

createProjectHandler.install();
openProjectHandler.install();
openDownloadManagerHandler.install();
let appIcon : Electron.Tray = null;
let coeServerStatusHandlerWindow: Electron.BrowserWindow = null;
export function openCOEServerStatusWindow(data: string = "") {
  if (coeServerStatusHandlerWindow) {
      coeServerStatusHandlerWindow.show();
  }
  else {
    coeServerStatusHandlerWindow = coeServerStatusHandler.openWindow(data, false);
  }
}

export function configureIntoCpsMenu() {

  let iconPath = path.join(__dirname + "/resources/into-cps/tray_icon.png");
  appIcon = new Tray(iconPath);
  appIcon.setToolTip('INTO-CPS Co-Simulation Orchestration Engine');
  var trayIconContextMenu = electron.remote.Menu.buildFromTemplate([
    {
      label: 'Show COE',
      click: function () {
        openCOEServerStatusWindow();
      }
    },
    {
      label: 'Shut down COE',
      click: function () {
        if(coeServerStatusHandlerWindow)
        {
          coeServerStatusHandlerWindow.webContents.send("kill");
          coeServerStatusHandlerWindow = null;
        }
      }
    }
  ]);
  appIcon.setContextMenu(trayIconContextMenu);

  const {remote} = require('electron');
  const app = remote.app
  const {Menu, MenuItem} = remote;

  // Definitions needed for menu construction
  var defaultMenu = require('electron-default-menu')
  // Get template for default menu 
  var menu: any[] = defaultMenu();


  var fileMenuPos = 0;

  if (process.platform === 'darwin') {
    fileMenuPos = 1;

    menu[0].submenu.splice(1, 0, {
      type: 'separator'

    });

    menu[0].submenu.splice(2, 0, {
      label: 'Preferences...',
      accelerator: 'Cmd+,',
      click: function (item: any, focusedWindow: any) {
        openSettingsHandler.openWindow();
      }
    });

    menu[0].submenu.splice(3, 0, {
      type: 'separator'

    });
  }

  // Add custom menu 
  menu.splice(fileMenuPos, 0, {
    label: 'File',
    submenu: [
      {
        label: 'New Project',
        accelerator: 'CmdOrCtrl+N',
        click: function (item: any, focusedWindow: any) {
          createProjectHandler.openWindow();
        }
      },
      {
        type: 'separator'
      },
      {
        label: 'Open Project',
        accelerator: 'CmdOrCtrl+O',
        click: function (item: any, focusedWindow: any) {
          openProjectHandler.openWindow();
        }

      },
      {
        label: 'Import Project from Git',

        click: function (item: any, focusedWindow: any) {
          fetchProjectFromGitHandler.openWindow();
        }

      },
      {
        label: 'Import Example Project',

        click: function (item: any, focusedWindow: any) {
          openExamplesFromGitHandler.openWindow();
        }

      },
      {
        type: 'separator'
      },
      {
        label: 'Open Current Project in File Browser',
        click: function (item: any, focusedWindow: any) {
          let activeProject = IntoCpsApp.getInstance().getActiveProject();
          if (activeProject != null)
            SystemUtil.openPath(activeProject.rootPath);
        },
      }
    ]
  })

  // Add File->Exit on Windows
  if (process.platform === 'win32') {
    menu[fileMenuPos].submenu.push(
      {
        type: 'separator'
      },
      {
        label: 'Exit',
        click: function (item: any, focusedWindow: any) {
          app.quit();
        }
      })
  }


  menu.forEach(m => {
    if (m.label == "Window") {
      if (!(process.platform === 'darwin')) {
        m.submenu.splice(m.submenu.length - 1, 0, {
          type: 'separator'

        });
        m.submenu.splice(-1, 0, {
          label: 'Show Settings',
          accelerator: 'Alt+S',
          click: function (item: any, focusedWindow: any) {
            openSettingsHandler.openWindow();
          }
        });

      }

      m.submenu.splice(m.submenu.length - 1, 0, {
        label: 'Show Co-simulation Orchestration Engine',
        accelerator: 'Alt+O',
        click: function (item: any, focusedWindow: any) {
          openCOEServerStatusWindow();
        }
      });


      m.submenu.splice(m.submenu.length - 1, 0, {
        label: 'Show Download Manager',
        accelerator: 'Alt+D',
        click: function (item: any, focusedWindow: any) {
          openDownloadManagerHandler.openWindow();
        }
      });

      m.submenu.splice(m.submenu.length - 1, 0, {
        label: 'Show FMU Builder',
        click: function (item: any, focusedWindow: any) {
          fmuBuilderHandler.openWindow();
        }
      });
      m.submenu.splice(m.submenu.length - 1, 0, {
        type: 'separator'

      });

    } else if (m.label == "Help") {
      m.submenu.splice(m.submenu.length - 1, 0, {
        label: 'Report Issue',
        click: function (item: any, focusedWindow: any) {
          reportIssueHandler.openWindow();
        }
      });
    }

  });



  // Set top-level application menu, using modified template 
  Menu.setApplicationMenu(Menu.buildFromTemplate(menu));




}
