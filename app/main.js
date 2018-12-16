'use strict';

//Atom Includes
var BrowserWindow = require('electron').BrowserWindow;
var Menu = require('electron').Menu;
var MenuItem = require('electron').MenuItem;
var ipc = require('electron').ipcMain;
var app = require('electron').app;
var dialog = require('electron').dialog;
var fs = require('fs');

var LOG_TO_UI = false;

process.on("error", (error) => console.error(error, error.stack));
process.on("uncaughtException", (error) => console.error(error, error.stack));

//Set up base path
global.__base = __dirname;

var PREFERENCES_DFLT = {
  maxRecentDocuments: 6,
  snapToGrid: true,
  snapUnit: 40,
  gridSize: 40,
  tickInterval: 30
};
//require("electron-json-storage").get(PREFERENCES_KEY, function (error, data) {
var args = require("yargs")(process.argv).alias('f', "file").boolean("reopen").argv;

//Hyperproduction includes
var ContainerMapNode = require("hp/model/ContainerMapNode");
var MapNode = require("hp/model/MapNode");
// var ComputeModules = require("hp/model/ComputeModules");
// var ports = require("hp/model/ports");
// var l = require("hp/model/log.js");

var EventRouter = require("hp/server/EventRouter");
var prefs = require("hp/server/Preferences").Preferences.instance;
prefs.setDefault(PREFERENCES_DFLT);
updateRecentDocument();

var mainWindow;
// GLOBAL.mainWindow = null;

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  if (process.platform != 'darwin') {
    app.quit();
  }
});

var myMapping = new ContainerMapNode();
var myRouter;
var myCurFile = null;
var myActiveMappingInfo = null;

var shutdown = function () {
  prefs.save();
  if (myRouter) {
    myRouter.destroy();
  }
  console.log("Quitting Hyperproduction.");
};
app.on('before-quit', shutdown);
app.on('window-all-closed', shutdown);

// Menu
var template = [{
  label: 'Hyperproduction',
  submenu: [{
    label: 'About Hyperproduction',
    selector: 'orderFrontStandardAboutPanel:'
  }, {
    type: 'separator'
  }, {
    label: 'Services',
    submenu: []
  }, {
    type: 'separator'
  }, {
    label: 'Preferences...',
    click: function () {
      // TODO: Show preferences dialog
    }
  }, {
    type: 'separator'
  }, {
    label: 'Hide Hyperproduction',
    accelerator: 'CmdOrCtrl+H',
    selector: 'hide:'
  }, {
    label: 'Hide Others',
    accelerator: 'CmdOrCtrl+Shift+H',
    selector: 'hideOtherApplications:'
  }, {
    label: 'Show All',
    selector: 'unhideAllApplications:'
  }, {
    type: 'separator'
  }, {
    label: 'Quit',
    accelerator: 'CmdOrCtrl+Q',
    click: function () {
      app.quit();
    }
  }, ]
}, {
  label: 'File',
  submenu: [{
    label: 'New Mapping',
    click: function () {
      // TODO: Prompt to save, if dirty. ...requires tracking dirty state somehow. Listen for any mutation events?
      loadProject();
      // myMapping.removeAll();
      // markDirty(false);
      myCurFile = null;
    }
  }, {
    label: 'Open Mapping...',
    accelerator: 'CmdOrCtrl+o',
    click: function () {
      var openPath = dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{
          name: "Hyperproduction Mapping", extensions: ["hpm"]
        }, {
          name: "All Files", extensions: ["*"]
        }]
      });
      if (openPath && openPath.length > 0) {
        loadProjectFromFile(openPath[0], true);
          // TODO: Close all panels used by old project ---> This may work now, if nodes are removed()
          // Why not use loadMapping()?
          // var mapping = JSON.parse(data);
          // myMapping.constructFromObj(mapping);
          // markDirty(false);
          // loadProject(JSON.parse(data));
      }
    }
  }, {
    label: 'Recent Mappings',
    submenu: prefs.preferences.recentDocuments.map((p) => ({label: p, click: () => loadProjectFromFile(p)}))
  }, {
    label: 'Import Mapping...',
    accelerator: 'CmdOrCtrl+i',
    click: function () {
      var openPath = dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{
          name: "Hyperproduction Mapping", extensions: ["hpm"]
        }, {
          name: "All Files", extensions: ["*"]
        }]
      });
      if (openPath && openPath.length > 0) {
        loadProjectFromFile(openPath[0], false);
      }
    }
  }, {
    type: 'separator'
  }, {
    label: 'Reload Mapping',
    accelerator: 'CmdOrCtrl+\\',
    click: function () {
      loadProject(myMapping, true);
    }
  }, {
    type: 'separator'
  }, {
    label: 'Save complete mapping',
    accelerator: 'CmdOrCtrl+S',
    click: function () {
      if (!myCurFile) {
        var savePath = dialog.showSaveDialog({
          properties: ['saveFile'],
          defaultPath: myCurFile,
          filters: [{
            name: "Hyperproduction Mapping", extensions: ["hpm"]
          }, {
            name: "All Files", extensions: ["*"]
          }]
        });
      }
      else {
        savePath = myCurFile;
      }
      if (savePath) {
        if (!savePath.endsWith(".hpm")) {
          savePath += ".hpm";
        }
        console.log("Attemping to write mapping to ", savePath);
        fs.writeFile(savePath, JSON.stringify(myMapping.serialize()), function (err) {
          if (err) {
            console.log(err);
          }
          else {
            markDirty(false);
            console.log("The file was saved!");
            myCurFile = savePath;
            mainWindow.setTitle("Hyperproduction - " + myCurFile);
            updateRecentDocument(myCurFile);
          }
        });
      }
    }
  }, {
    label: 'Increment and save mapping',
    accelerator: 'CmdOrCtrl+Alt+S',
    click: function () {
      let savePath = myCurFile;
      if (savePath) {
        console.log(savePath);
        let match = /(.*)(\d+)\.hpm/.exec(savePath);
        if (match && match.length > 1) {
          let n = (Number.parseInt(match[2], 10) + 1).toString();
          // savePath = match[0] + ((n.padStart(match[1].length, '0')) + ".hpm";
          while (n.length < match[2].length) {
            n = '0' + n;
          }
          savePath = match[1] + n + ".hpm";
        }
        else {
          savePath = savePath.substr(0, savePath.length - 4) + "_01.hpm";
        }
      }
      if (!savePath) {
        savePath = dialog.showSaveDialog({
          properties: ['saveFile'],
          defaultPath: myCurFile,
          filters: [{
            name: "Hyperproduction Mapping", extensions: ["hpm"]
          }, {
            name: "All Files", extensions: ["*"]
          }]
        });
      }
      if (savePath) {
        if (!savePath.endsWith(".hpm")) {
          savePath += ".hpm";
        }
        console.log("Attemping to write mapping to ", savePath);
        fs.writeFile(savePath, JSON.stringify(myMapping.serialize()), function (err) {
          if (err) {
            console.log(err);
          }
          else {
            markDirty(false);
            console.log("The file was saved!");
            myCurFile = savePath;
            mainWindow.setTitle("Hyperproduction - " + myCurFile);
            updateRecentDocument(myCurFile);
          }
        });
      }
    }
  }, {
    label: 'Save complete mapping As...',
    accelerator: 'CmdOrCtrl+Alt+Shift+S',
    click: function () {
      var savePath = dialog.showSaveDialog({
        properties: ['saveFile'],
        defaultPath: myCurFile,
        filters: [{
          name: "Hyperproduction Mapping", extensions: ["hpm"]
        }, {
          name: "All Files", extensions: ["*"]
        }]
      });
      if (savePath) {
        if (!savePath.endsWith(".hpm")) {
          savePath += ".hpm";
        }
        console.log("Attemping to write mapping to ", savePath);
        fs.writeFile(savePath, JSON.stringify(myMapping.serialize()), function (err) {
          if (err) {
            console.log(err);
          }
          else {
            markDirty(false);
            console.log("The file was saved!");
            myCurFile = savePath;
            mainWindow.setTitle("Hyperproduction - " + myCurFile);
            updateRecentDocument(myCurFile);
          }
        });
      }
    }
  }, {
    label: 'Export active mapping...',
    accelerator: 'CmdOrCtrl+Shift+S',
    click: function () {
      // TODO: Prompt only if we don't know the file name. If we do, just use that. We'd need an "As" version to update the reference to a new file.
      var savePath = dialog.showSaveDialog({
        defaultPath: (myActiveMappingInfo && myActiveMappingInfo.path) ? myActiveMappingInfo.path : "",
        properties: ['saveFile']
      });
      if (savePath) {
        if (!savePath.endsWith(".hpm")) {
          savePath += ".hpm";
        }
        console.log("Attemping to write active mapping to ", savePath, myActiveMappingInfo.path);
        var updateRef = false;
        if (myActiveMappingInfo && myActiveMappingInfo.path && myActiveMappingInfo.path !== savePath) {
          var dialogResult = dialog.showMessageBox({
            type: "none",
            title: "Update File Reference",
            message: "You are saving a nested mapping that references an external mapping file. Would you like to update this instance to reference the new file?",
            buttons: ["No", "Yes"]
          });
          updateRef = (dialogResult === 1);
        }
        mainWindow.webContents.send("ui-event", {
          action: "saveActiveMapping",
          filePath: savePath,
          updateFileRef: updateRef
        });
        console.info("The active mapping has been saved.");
      }
    }
  }, {
    type: 'separator'
  }, {
    label: 'Save window layout'
  }]
}, {
  label: 'Edit',
  submenu: [{
    label: 'Undo',
    accelerator: 'CmdOrCtrl+Z',
    selector: 'undo:'
  }, {
    label: 'Redo',
    accelerator: 'Shift+CmdOrCtrl+Z',
    selector: 'redo:'
  }, {
    type: 'separator'
  }, {
    label: 'Cut',
    accelerator: 'CmdOrCtrl+X',
    click: function () {
      mainWindow.webContents.send("ui-event", {
        action: "cut"
      });
    }
  }, {
    label: 'Copy',
    accelerator: 'CmdOrCtrl+C',
    enabled: true,
    click: function () {
      mainWindow.webContents.send("ui-event", {
        action: "copy"
      });
    }
  }, {
    label: 'Duplicate',
    accelerator: 'CmdOrCtrl+D',
    click: function () {
      mainWindow.webContents.send("ui-event", {
        action: "duplicate"
      });
    }
  }, {
    label: 'Paste',
    accelerator: 'CmdOrCtrl+V',
    enabled: true,
    click: function () {
      mainWindow.webContents.send("ui-event", {
        action: "paste"
      });
    }
  }, {
    label: 'Nest Selection',
    click: function () {
      mainWindow.webContents.send("ui-event", {
        action: "nest"
      });
    }
  }, {
    label: 'Select All',
    accelerator: 'CmdOrCtrl+A',
    click: function () {
      mainWindow.webContents.send("ui-event", {
        action: "selectAll"
      });
    }
  }, {
    label: 'Deselect All',
    accelerator: 'CmdOrCtrl+Shift+A',
    click: function () {
      mainWindow.webContents.send("ui-event", {
        action: "selectNone"
      });
    }
  }, {
    type: 'separator'
  }, {
    label: 'Reset All Ports on Selected',
    click: function () {
      mainWindow.webContents.send("ui-event", {
        action: "reset-port-values-selected", // TODO
        filter: "all"
      });
    }
  }, {
    label: 'Reset Open Ports on Selected',
    click: function () {
      mainWindow.webContents.send("ui-event", {
        action: "reset-port-values-selected", // TODO
        filter: "open"
      });
    }
  }, {
    label: 'Reset Closed Ports on Selected',
    click: function () {
      mainWindow.webContents.send("ui-event", {
        action: "reset-port-values-selected", // TODO
        filter: "closed"
      });
    }
  }, {
    label: 'Reset Connected Ports on Selected',
    click: function () {
      mainWindow.webContents.send("ui-event", {
        action: "reset-port-values-selected", // TODO
        filter: "connected"
      });
    }
  }, {
    type: 'separator'
  }, {
    label: 'New Container Map',
    accelerator: 'CmdOrCtrl+Shift+Y',
    click: function () {
      // get the active mapping and create node
      if (myActiveMappingInfo) {
        var activeMapping = MapNode.getMapNodeById(myActiveMappingInfo.container);
        if (activeMapping) {
          activeMapping.createNode("ContainerMapNode", null, 600, 600);
          // TODO: set position of the node; add-node-to-active does this, but it's a CustomEvent, not on the backend.
        }
        else if (myActiveMappingInfo.container === myMapping.id) {
          myMapping.createNode("ContainerMapNode", null, 600, 600);
        }
      }
      else {
        myMapping.createNode("ContainerMapNode", null, 600, 600);
      }
    }
  }, {
    label: 'Unlink File Reference',
    click: function () {
      // get the active mapping and delete the fileRef
      if (myActiveMappingInfo) {
        var activeMapping = MapNode.getMapNodeById(myActiveMappingInfo.container);
        if (activeMapping) {
          delete activeMapping.fileRef;
          // TODO: Remove indication of fileRef in the UI
        }
      }
    }
  }
]
}, {
  label: 'View',
  submenu: [{
    label: 'Snap To Grid',
    type: "checkbox",
    checked: prefs.preferences.snapToGrid,
    click: function (menuItem, browserWindow) {
      // TODO: Implement Preferences and the handler for this on the frontend.
      mainWindow.webContents.send("ui-event", {
        action: "setSnap",
        snapEnabled: menuItem.checked,
        snapUnit: prefs.preferences.snapUnit
      });
      prefs.preferences.snapToGrid = menuItem.checked;
    }
  }, {
    type: 'separator'
  }, {
    label: 'Toggle Port Editor Shyness',
    type: "checkbox",
    accelerator: 'CmdOrCtrl+Alt+E',
    click: function (menuItem, browserWindow) {
      mainWindow.webContents.send("ui-event", {
        action: "togglePortEditorVisibility",
        state: menuItem.checked
      });
    }
  }, {
    label: 'Open All Port Editors for Selected',
    accelerator: 'CmdOrCtrl+Alt+A',
    click: function () {
      mainWindow.webContents.send("ui-event", {
        action: "togglePortEditorsSelected",
        state: "open"
      });
    }
  }, {
    label: 'Open Input Port Editors for Selected',
    accelerator: 'CmdOrCtrl+Alt+Shift+I',
    click: function () {
      mainWindow.webContents.send("ui-event", {
        action: "togglePortEditorsSelected",
        state: "inputs"
      });
    }
  }, {
//    label: 'Open Unconnected Port Editors for Selected',
//    click: function () {
//      mainWindow.webContents.send("ui-event", {
//        action: "togglePortEditorsSelected",
//        state: "unconnected"
//      });
//    }
//  }, {
    label: 'Close Port Editors for Selected',
    accelerator: 'CmdOrCtrl+Alt+Shift+A',
    click: function () {
      mainWindow.webContents.send("ui-event", {
        action: "togglePortEditorsSelected",
        state: "close"
      });
    }
  }, {
    label: 'Close All Port Editors',
    click: function () {
      mainWindow.webContents.send("ui-event", {
        action: "closePortEditors"
      });
    }
  }, {
    type: 'separator'
  }, {
    label: 'Reload',
    accelerator: 'CmdOrCtrl+R',
    click: function () {
      BrowserWindow.getFocusedWindow().reloadIgnoringCache();
    }
  }, {
    label: 'Toggle DevTools',
    accelerator: 'Alt+CmdOrCtrl+I',
    click: function () {
      BrowserWindow.getFocusedWindow().toggleDevTools();
    }
  }, ]
}, {
  label: 'Window',
  role: 'window',
  submenu: [{
    label: 'Minimize',
    accelerator: 'CmdOrCtrl+M',
    selector: 'performMiniaturize:'
  }, {
    label: 'Close Tab',
    accelerator: 'CmdOrCtrl+W',
    // selector: 'performClose:'
    click: function () {
      mainWindow.webContents.send("ui-event", {
        action: "closeTab"
      });
    }
    // TODO: Close all panels but root (and console)
  }, {
    type: 'separator'
  }, {
    label: 'Fullscreen',
    accelerator: 'CmdOrCtrl+Shift+F',
    type: 'checkbox',
    checked: !!prefs.preferences.fullScreen,
    click: function (menuItem, browserWindow) {
      // mainWindow.setFullScreen(!mainWindow.isFullScreen());
      prefs.preferences.fullScreen = menuItem.checked;
      mainWindow.setFullScreen(menuItem.checked);
    }
  }, {
    type: 'separator'
  }, {
    label: 'Bring All to Front',
    selector: 'arrangeInFront:'
  }, ]
}, {
  label: 'Help',
  role: 'help',
  submenu: [
    {
      label: "About...",
      click: function (menuItem, browserWindow) {
        console.log(JSON.stringify(process.versions));
        dialog.showMessageBox(mainWindow, {
          type: "none",
          title: "Hyperproduction",
          message: `Hyperproduction ${app.getVersion().split('.').slice(0, 2).join('.')}\n\nCreated by Ben Bloomberg and Peter Torpey.`,
          detail: `Additional development by Garrett Parrish and Kevin King.\n\n${app.getName()} ${app.getVersion()} Build: 2222\nElectron: ${process.versions.electron}\nNode: ${process.versions.node}\nChrome: ${process.versions.chrome}`
        });
      }
    }
  ]
}, ];
// TODO: About
// Authors, HP version+build, electron version, node version, chromium version

function updateRecentDocument(path) {
  let added = false;
  if (path) {
    app.addRecentDocument(path);
    if (!Array.isArray(prefs.preferences.recentDocuments)) {
      prefs.preferences.recentDocuments = [path];
      added = true;
    }
    else {
      let recentIndex = prefs.preferences.recentDocuments.indexOf(path);
      added = true;
      if (recentIndex > -1) {
        prefs.preferences.recentDocuments.splice(recentIndex, 1);
        added = false;
      }
      prefs.preferences.recentDocuments.unshift(path);
      if (prefs.preferences.recentDocuments.length > prefs.preferences.maxRecentDocuments) {
        prefs.preferences.recentDocuments.length = prefs.preferences.maxRecentDocuments;
      }
    }
  }
  else {
    if (!Array.isArray(prefs.preferences.recentDocuments)) {
      prefs.preferences.recentDocuments = [];
    }
    if (prefs.preferences.recentDocuments.length > prefs.preferences.maxRecentDocuments) {
      prefs.preferences.recentDocuments.length = prefs.preferences.maxRecentDocuments;
    }
  }
  if (menu && added) {
    // LATER: This is fragile, as the indices need to be changed if the menu structure changes.
    menu.items[1].submenu.items[2].submenu.insert(0, new MenuItem({label: path, click: () => {
      loadProjectFromFile(path);
    }}));
  }
}

if (LOG_TO_UI) {
  var CONSOLE = {};
  CONSOLE.log = global.console.log;
  CONSOLE.warn = global.console.warn;
  CONSOLE.error = global.console.error;
  CONSOLE.info = global.console.info;
  
  var formatLogItem = function (string, item) {
    if (!string || string.length === 0) {
      return (typeof item === "string") ? item : JSON.stringify(item);
    }
    else {
      return string + ", " + ((typeof item === "string") ? item : JSON.stringify(item));
    }
  };
  
  global.console.log = function () {
    mainWindow.webContents.send("console-log", {data: Array.prototype.reduce.call(arguments, formatLogItem, ""), "type": "log"});
    CONSOLE.log.apply(this, arguments);
  };
  
  global.console.warn = function () {
    mainWindow.webContents.send("console-log", {data: Array.prototype.reduce.call(arguments, formatLogItem, ""), "type": "warn"});
    CONSOLE.warn.apply(this, arguments);
  };
  
  global.console.error = function () {
    mainWindow.webContents.send("console-log", {data: Array.prototype.reduce.call(arguments, formatLogItem, ""), "type": "error"});
    CONSOLE.error.apply(this, arguments);
  };
  
  global.console.info = function () {
    mainWindow.webContents.send("console-log", {data: Array.prototype.reduce.call(arguments, formatLogItem, ""), "type": "info"});
    CONSOLE.info.apply(this, arguments);
  };
}

var menu = Menu.buildFromTemplate(template);

var projectIsDirty = false;
function markDirty(isDirty) {
  projectIsDirty = (typeof isDirty === 'undefined' || isDirty);
  var t = myCurFile || "New Mapping";
  if (projectIsDirty) {
    mainWindow.setTitle("Hyperproduction - " + t + "*");
  } else {
    mainWindow.setTitle("Hyperproduction - " + t);
  }
}

// LATER: Make a preference to specify a default or reload previous file. Combine this with loadProject() (do we need to heed the timeout at the end, then?).
function loadDefaultMapping() {
  fs.readFile(__dirname + "/maps/default.hpm", function (err, data) {
    if (err) {
      console.log("No default map found.");
      return;
      //throw err;
    }
    var mapping = JSON.parse(data);
    myMapping.constructFromObj(mapping);
  });
}

function loadProjectFromFile(path, newMapping) {
  fs.readFile(path, function (err, data) {
    if (err) {
      throw err;
    }
    myCurFile = path;
    loadProject(data.toString(), newMapping, myCurFile); // data is a buffer that needs to be converted to a string.
    updateRecentDocument(myCurFile);
  });
}

function loadProject(cmn, newMapping, title) {
// TODO: Remove panels related to current project
//  if (myRouter) {
//    myRouter.destroy();
//  }
  var id = null;
  if (myMapping) {
    // myMapping.removeListener('mapping-changed', markDirty);
    id = myMapping.id;
  }
  if (cmn) {
    //console.log(cmn);
    // myMapping = ContainerMapNode.buildFromJSON((typeof cmn === 'string') ? cmn : JSON.stringify(cmn.serialize()));
    var mapObj = (typeof cmn === 'string') ? JSON.parse(cmn) : cmn.serialize();
    if (newMapping) {
//      if (typeof cmn.destroy === 'function') {
//        cmn.destroy();
//      }
      myMapping.removeAll();
      // myMapping = new ContainerMapNode((typeof cmn === 'string') ? JSON.parse(cmn) : cmn.serialize(), id);
      // TODO: Close all panels used by old project ---> This may work now, if nodes are removed()
    }
    myMapping.constructFromObj(mapObj);
  }
  else {
    myMapping.removeAll();
    // VERIFY: This creation of a new CMN has always been there for this case,
    // but it recently caused a problem where there were two CMNs with the same ID
    // and the wrong one was getting serialized.
    // So, if we only ever have one root instance, and we just removeAll(), as in the newMapping case,
    // what's the harm? I'm sure we're leaking references to things, but this case only happens at startup, I think.
    // myMapping = new ContainerMapNode(null, id);
  }
  // mainWindow.webContents.send('ui-event', {action: "mappingLoading", mappingId: myMapping.id});
  markDirty(false);
}

function ready() {
  return new Promise((resolve, reject) => {
    app.on('ready', resolve);
  });
}

console.log("Initializing application...");
Promise.all([ready(), prefs.load()]).then(function () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1680,
    height: 1050
  });

  mainWindow.webContents.on('dom-ready', () => {
    // We may want to remove this event handler after it runs initially on application launch,
    // otherwise, the project would get loaded again if just the window gets refreshed.
    let lastDocument = (args.reopen ? (prefs.preferences.recentDocuments && prefs.preferences.recentDocuments[0]) : undefined);
    if (args.file) {
      loadProjectFromFile(args.file, true);
    }
    else if ((args.reopen || prefs.preferences.reopen) && lastDocument) {
      console.log("Previous document: ", lastDocument);
      loadProjectFromFile(lastDocument, true);
    }
    else {
      loadProject();
    }
  });
  
  myMapping.on('mapping-changed', markDirty);
  myRouter = new EventRouter(myMapping, mainWindow);


  ipc.on('request-root-id', function (event) {
    event.returnValue = myMapping.id;
  });
  
  ipc.on('request-load', function (eventType, refcon) {
    if (refcon.action && refcon.file) {
      switch (refcon.action) {
        case "open":
          loadProjectFromFile(refcon.file, true);
          break;
        case "import":
          loadProjectFromFile(refcon.file, false);
          break;
        case "nest":
          fs.readFile(refcon.file, function (err, data) {
            if (err) {
              throw err;
            }
            var container = myMapping;
            if (container.id !== refcon.containerId) {
              container = MapNode.getMapNodeById(refcon.containerId);
            }
            if (container && container instanceof ContainerMapNode) {
              container.createNode(JSON.parse(data.toString()), null, refcon.x, refcon.y, refcon.file);
            }
          });
          break;
        default:
          break;
      }
    }
  });
  
  ipc.on("ui-event", function (eventType, refcon) {
    switch (refcon.action) {
      case "active-mapping-changed":
        myActiveMappingInfo = refcon;
        break;
      default:
        break;
    }
  });

  Menu.setApplicationMenu(menu);

  // and load the index.html of the app.
  mainWindow.loadURL("file://" + __dirname + "/index.html");
  // Preference to launch FS.
  mainWindow.setFullScreen(!!prefs.preferences.fullScreen);

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
    myRouter.stopFrontEndEvents();
  });
    
  menu.items[1].submenu.items[2].submenu.clear();
  prefs.preferences.recentDocuments.forEach((p) => {
    menu.items[1].submenu.items[2].submenu.append(new MenuItem({label: p, click: () => loadProjectFromFile(p)}));
  });
  
});
