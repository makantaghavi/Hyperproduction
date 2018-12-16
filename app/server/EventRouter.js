'use strict';

var ipc = require('electron').ipcMain;
var fs = require('fs');
var MapNode = require("hp/model/MapNode");
var ContainerMapNode = require("hp/model/ContainerMapNode");
var Type = require("hp/model/ports").Type; 
var direction = require("hp/model/ports.js").Direction;
var bb = require("hp/model/benb_utils");
var MathUtil = require("hp/lib/ptlib/util/MathUtil");
// VERIFY: The returned instance is indeed shared by all required Preferences?
var prefs = require("hp/server/Preferences").Preferences.instance;
// Needed for eval of defns
// var l = require("app/server/log");
// var OscDeviceModules = require("app/server/OscDeviceModules");
// var OscReceiveNode = require('app/server/OscReceiveNode');
// var OscSendNode = require('app/server/OscSendNode');

var EVENTS = ["mapping-changed",
              "data-update",
              "graph-update",
              "configure-node",
              "configure-port",
              "failover-ui-event",
              "play-audio",
              "multi-graph-update",
              "widget-update",
              "preset-update",
              "preference-changed"
              ];

function EventRouter(model, mainWindow) {
  this.model = model;
  var that = this;

  this.handleModelEvent = function(evtType, refcon) {
    mainWindow.webContents.send(evtType, refcon);
  };

  this.handleIPCEvent = function(evtType, refcon) {
    var containerID = refcon.container;
    var model = MapNode.getMapNodeById(containerID) || this.model;
    switch (refcon.action) {
      case 'add-node':
        //console.log("ADDING MAP NODE to MODEL");
        model.createNode(refcon.nodeType, bb.uuid(), refcon.x, refcon.y);
        break;
//      case 'add-osc-node':
//        //console.log("ADDING OSC NODE to MODEL");
//        var odm = OscDeviceModules[refcon.nodeType];
//        var oscDevice = (odm.deviceType == "SND") ? OscSendNode : OscReceiveNode;
//        var oscNode = new oscDevice(null, odm, odm.defaultPort, odm.defaultHost, refcon.x, refcon.y);
//        model.createDeviceNode(oscNode);
//        break;
      case 'remove-node':
        model.removeNode(refcon.id);
        break;
      case 'move-node':
        model.moveNode(refcon.id, refcon.x, refcon.y);
        break;
      case 'copy-nodes':
        model.selectNodes(refcon.ids);
        break;
      case 'paste-nodes':
        model.pasteCopiedNodes(refcon.x, refcon.y);
        break;
      case 'nest-nodes':
        model.nestCopiedNodes();
        break;
      case 'add-connection':
        model.connectByPortId(refcon.sourceId, refcon.targetId);
        break;
      case 'remove-connection':
        model.disconnectPorts(refcon.connection,refcon.sourceId,refcon.targetId);
        break;
      case 'request-port-value-updates':
        model.requestPortUpdatesById(refcon.id);
        break;
      case 'cancel-port-value-updates':
        model.cancelPortUpdatesById(refcon.id);
        break;
      case 'sync-get-port-value-by-id':
        var value = MapNode.getPortById(refcon.portId).value;
        evtType.returnValue = value;
        break;
      case 'set-port-value':
        model.setValueByPortId(refcon.id, refcon.value);
        break;
      case 'set-port-value-by-path':
        model.setValueByPortPath(refcon.path, refcon.value);
		break;
      case 'reset-port-value':
        model.resetValueByPortId(refcon.id);
        break;
      case 'reset-port-values-selected':
        model.resetValuesSelected(refcon.nodes, refcon.filter);
        break;
      case 'request-port-direction':
        var dir = MapNode.getPortById(refcon.id).direction;
        mainWindow.webContents.send('port-direction',{"portdir": dir});
        break;
      case 'toggle-publish-port':
        var published = model.togglePublishPort(refcon.id, refcon.publish);
        break;
      case 'request-published-port-list':
        var publishedPortList = model.getPublishedPortList();
        mainWindow.webContents.send('published-port-list', {"publishedPortList":publishedPortList});
        break;
      case 'request-send-preset':
        mainWindow.webContents.send('send-preset', {'value': refcon.preset});
        break;
      case 'rebuild-ui':
        model.rebuildUI();
        break;
      case 'ui-event':
        model.mapNodeUIEvent(refcon);
        break;
      case 'set-node-name':
        // this.model.getMapNodes()[refcon.id].nodeName = refcon.value;
        console.log("ER set-node-name");
        MapNode.getMapNodeById(refcon.id).nodeName = refcon.value;
        break;
      case 'set-node-defn':
        try {
          var node = MapNode.getMapNodeById(refcon.id);
          var defn = refcon.defn;
          if (defn) {
            defn = (eval(defn)).call(node.defn, MathUtil);
            node.installDefn(defn);
//            this.handleModelEvent('mapping-changed', {
//              "action": "remove-node",
//              "container": node.parent.id,
//              "node": node.id
//            });
//            this.handleModelEvent('mapping-changed', {
//              "action": "add-node",
//              "container": node.parent.id,
//              "nodeSpec": node.serialize()
//            })
			// node.parent.rebuildUI();
            node.parent.rebuildUINode(node);
          }
        }
        catch (excpt) {
          console.warn("Failed to install node defn: " + excpt);
          console.warn(defn);
        }
        break;
      case 'mute-node':
        var node = MapNode.getMapNodeById(refcon.id);
        node.muted = refcon.muted;
        break;
      default:
        break;
    }
  }.bind(this);
  
  ipc.on('request-mapping-change', this.handleIPCEvent);
  ipc.on('ui-event', this.handleIPCEvent);
  ipc.on('request-configure-node', this.handleIPCEvent);
  ipc.on('request-published-port-list', this.handleIPCEvent);
  
  ipc.on('write-file', function (evtType, refcon) {
    fs.writeFile(__dirname + refcon.path + refcon.fileName, refcon.data, function (err) {
        if (err) {
          console.warn(err);
        }
        else {
          console.log("File \"" + refcon.path + refcon.fileName + "\" saved");
        }
      });
  });
  
  ipc.on('write-node-file', function (evtType, refcon) {
    var node = MapNode.getMapNodeById(refcon.id);
    if (node) {
      if (refcon.updateFileRef) {
        node.fileRef = refcon.path + refcon.fileName; // For saveActiveMapping, fileName should be the empty string anyway.
        // mainWindow.webContents.send("ui-event", {action: "file-ref", container: node.id, path: refcon.path + refcon.fileName});
      }
      fs.writeFile(refcon.path + refcon.fileName, JSON.stringify(node.serialize()), function (err) {
          if (err) {
            console.warn(err);
          }
          else {
            console.log("File \"" + refcon.fileName + "\" saved");
          }
        });
    }
  });
  
  ipc.on('request-node-ui', function (evtType, refcon) {
    var node = MapNode.getMapNodeById(refcon.id);
    if (node) {
      if (node instanceof ContainerMapNode) {
        mainWindow.webContents.send("node-editor", {nodeType: "mapping", id: node.id, defn: node.serialize()});
      }
      else if (node.defn.uiDefn) {
        var name = (node.nodeName) ? node.nodeName + " " + node.defn.nodetype : node.defn.nodetype;
        mainWindow.webContents.send("node-ui", {nodeType: "node", id: node.id, defn: node.defn.uiDefn, nodeName: name, ports: node.getPorts()});
      }
    }
  });

  ipc.on('request-node-editor', function (evtType, refcon) {
    var node = MapNode.getMapNodeById(refcon.id);
    if (node) {
      if (node instanceof ContainerMapNode) {
        mainWindow.webContents.send("node-editor", {nodeType: "mapping", id: node.id, defn: node.serialize()});
      }
      else {
        mainWindow.webContents.send("node-editor", {nodeType: "node", id: node.id, defn: node.defn, procfn: node.defn.procfn.toString(), initFn: (node.defn.initFn) ? node.defn.initFn.toString() : "", tick: (node.defn.tick) ? node.defn.tick.toString() : ""});
      }
    }
  });

  EVENTS.forEach(function(evt) {
    that.model.on(evt, that.handleModelEvent);
  });

  var hrDateNow = function() {
    var hr = process.hrtime();
    return hr[0] * 1e3 + hr[1] * 1e-6;
  };

  
//  Object.defineProperty(EventRouter, "INTERVAL", {
//    enumerable: true,
//    configurable: false,
//    writable: false,
//    value: 30
//  });
  //start global timer loop
  var prevTick = hrDateNow();
  var startTick = prevTick;
  var currentTick;
  var delta = 0;
  var sendTick = function() {
    currentTick = hrDateNow();
    delta = currentTick - prevTick;
  //  that.model.emit("global-tick", {currentTick: currentTick, prevTick: prevTick, seconds: (currentTick - startTick) / 1000, interval: EventRouter.INTERVAL, delta: delta});
    that.model.emit("global-tick", {currentTick: currentTick, prevTick: prevTick, seconds: (currentTick - startTick) / 1000, interval: prefs.preferences.tickInterval, delta: delta});  
    prevTick = currentTick;
  };

  // setInterval(sendTick, EventRouter.INTERVAL);
  setInterval(sendTick, prefs.preferences.tickInterval);
  // VERIFY: Use setInterval() or an adaptive-delay setTimeout() ?
  
//  var prevHrTick = hrDateNow();
//  var startHrTick = prevTick;
//  var currentHrTick;
//  var hrCount = 100;
//  var delta = 0;
//  var sendHrTick = function() {
//    if (hrCount < 0) {
//      hrCount = 100;
//      currentHrTick = hrDateNow();
//      delta = currentHrTick - prevHrTick;
//      if (delta > 5) {
//        that.model.emit("global-hr-tick", {currentTick: currentHrTick, prevTick: prevHrTick, seconds: (currentHrTick - startHrTick) / 1000, delta: delta});
//        prevHrTick = currentHrTick;
//      }
//    }
//    hrCount--;
//    process.nextTick(sendHrTick);
//  }
//  // process.nextTick(sendHrTick);

  this.stopFrontEndEvents = function () {
    EVENTS.forEach((evt) => {
      this.model.removeListener(evt, that.handleModelEvent);
    });
  }
  
  this.destroy = function () {
    this.stopFrontEndEvents();
    ipc.removeListener('request-mapping-change', this.handleIPCEvent);
    ipc.removeListener('request-configure-node', this.handleIPCEvent);
    ipc.removeListener('ui-event', this.handleIPCEvent);
    ipc.removeListener('request-published-port-list', this.handleIPCEvent);
    // This is dangerous, as it will remove all listeners on the model, but EventRouter may not be the only listener.
    // It will work for now, as we only ever need to destroy() this when we're building a new model.
    // that.model.removeAllListeners();
  };
}

module.exports = EventRouter;
