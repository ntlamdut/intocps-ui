'use strict';

const electron = require('electron');
const fs = require('fs');
const path = require('path');
var settings = require("./settings/settings").default;
var SettingKeys = require("./settings/SettingKeys");
var IntoCpsApp = require("./IntoCpsApp").default;


// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;
let intoCpsApp = new IntoCpsApp(app, process.platform);

global.intoCpsApp = intoCpsApp;
let devMode = intoCpsApp.getSettings().getValue(SettingKeys.SettingKeys.DEVELOPMENT_MODE);
console.info("Running in development mode: " + devMode);




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


  mainWindow.on('close', function (ev) {
    if (!intoCpsApp.isquitting){
      intoCpsApp.isquitting = true;
      ev.preventDefault();
      intoCpsApp.trmanager.stop(mainWindow.close.bind(mainWindow));
    }else{
      BrowserWindow.getAllWindows().forEach((bw => {
        if (bw != mainWindow) {
          bw.removeAllListeners();
          bw.close();
        }
      }));
    }
  });

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
app.on('ready', function () {
  createWindow();
});


// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
	//the app is not build to handle this since windows are created
	//from render processes
	//if (process.platform !== 'darwin') {
    app.quit();
  //}
});

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});




