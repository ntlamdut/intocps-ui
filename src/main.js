'use strict';

const electron = require('electron');
const fs = require('fs');
const path = require('path');
var settings = require("./settings/settings").default;
var SettingKeys = require("./settings/SettingKeys");
var IntoCpsApp = require("./IntoCpsApp").default;

var DialogHandler = require("./DialogHandler").default;
var IntoCpsAppEvents = require("./IntoCpsAppEvents");
var ProjectFetcher = require("./proj/ProjectFetcher");

// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

let intoCpsApp = new IntoCpsApp(app, process.platform);

global.intoCpsApp = intoCpsApp;
let devMode = intoCpsApp.getSettings().getValue(SettingKeys.SettingKeys.DEVELOPMENT_MODE);
console.info("Running in development mode: " + devMode);

let createProjectHandler = new DialogHandler("proj/new-project.html", 300, 200, IntoCpsAppEvents.OPEN_CREATE_PROJECT_WINDOW, "new-project-create", arg => {
  intoCpsApp.createProject(arg.name, arg.path);
});

let openProjectHandler = new DialogHandler("proj/open-project.html", 300, 200, IntoCpsAppEvents.OPEN_OPEN_PROJECT_WINDOW, "open-project-open", arg => {
  intoCpsApp.setActiveProject(intoCpsApp.loadProject(arg.path));
});

let openDownloadManagerHandler = new DialogHandler("downloadManager/DownloadManager.html", 500, 500, null, null, null);
let coeServerStatusHandler = new DialogHandler("coe-server-status/CoeServerStatus.html", 500, 500, null, null, null);
let fmuBuilderHandler = new DialogHandler("http://sweng.au.dk/fmubuilder/", 500, 500, null, null, null);
fmuBuilderHandler.externalUrl = true;
let reportIssueHandler = new DialogHandler("http://github.com/into-cps/INTO-CPS_Application/issues/new", 600, 600, null, null, null);
reportIssueHandler.externalUrl = true;


let fetchProjectFromGitHandler = new DialogHandler("proj/ProjectFetcher.html", 500, 300, null, null, null);
let openExamplesFromGitHandler = new DialogHandler("examples/examples.html", 500, 400, null, null, null);

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({ width: 800, height: 600 });

  // and load the index.html of the app.
  mainWindow.loadURL('file://' + __dirname + '/index.html');

  // Open the DevTools.
  if (devMode) {
    mainWindow.webContents.openDevTools();
  }

  intoCpsApp.setWindow(mainWindow);



  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });

  /* //We cannot fire any events indicating that the active project has been loaded since we dont know when all recievers are loaded and ready
    mainWindow.on('minimize', function () {
      //Activate project
      console.info("Setting active project on show")
      let p = global.intoCpsApp.getActiveProject();
      console.info(p);
      global.intoCpsApp.setActiveProject(p);
  
    });*/
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});



createProjectHandler.install();
openProjectHandler.install();
openDownloadManagerHandler.install();

