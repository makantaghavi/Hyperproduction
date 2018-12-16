var ports = require('./ports.js');
var bb = require("./benb_utils.js");
var l = require("./log.js");
var PortDirection = require("./ports.js").Direction;
var ComputeModules = require("./ComputeModules.js").getInstance();
var MathUtil = require("hp/lib/ptlib/util/MathUtil");
var ColorUtil = require("hp/lib/ptlib/util/ColorUtil");

var nodeList = {};
var portList = {};
var mapNodesByPortId = {};

// var DEBOUNCE_INTERVAL = 1000 / 30;

var MapNode = function (defn, id, x, y, emt) {
  // console.log(defn);
  // console.log("CREATING MAP NODE");
  //reinit defn based on nodetype, so we can pass in serialized modules
  var cms = ComputeModules.getModules();
//  if (defn.parentDefn) {
//    this.defn = cms[defn.parentDefn];
//  }
//  else {
//    this.defn = (defn.procfn)
//  }
  this.defn = (defn.procfn || defn.procfnStr) ? defn : cms[defn.nodetype];
  // console.log("DEF");
  // console.log(defn);
  //console.log("Nodetype");
  //console.log(this.defn)

  var that = this;
  this.id = (id == null) ? bb.uuid() : id; // this needs to be == not === for some reason, else loading doesn't work
  // this.uiid = defn.uiid || bb.uuid();
  this.ports = {};
  this.parent = null;
  this.nodeState = {
    runningState: MapNode.RunningState.INIT
  };
  x = (defn.x) ? defn.x : x;
  y = (defn.y) ? defn.y : y;
  this.x = x || 0;
  this.y = y || 0;
  
  if (defn.muted) {
    this.muted = true;
  }
	
  // if procfnstr eval ifdef
  if (defn.procfnStr) {
    try {
      this.defn.procfn = (eval("(function () {return (" + defn.procfnStr + ");})")).call(this.defn, MathUtil, ColorUtil);
    }
    catch (ex) {
      console.warn("Error parsing serialized procfn: ", defn.procfnStr, ex);
    }
  }
  
  if (defn.initFnStr) {
    try {
      this.defn.initFn = (eval("(function () {return (" + defn.initFnStr + ");})")).call(this.defn, MathUtil, ColorUtil);
    }
    catch (ex) {
      console.warn("Error parsing serialized procfn: ", defn.initFnStr, ex);
    }
  }

  if (defn.tickStr) {
    try {
      this.defn.tick = (eval("(function () {return (" + defn.tickStr + ");})")).call(this.defn, MathUtil, ColorUtil);
    }
    catch (ex) {
      console.warn("Error parsing serialized procfn: ", defn.tickStr, ex);
    }
  }
    
  this._nodeName = defn.nodeName || "";

  this.makePort = this.makePort.bind(that);
  
  var init = function () {
    bb.forEachObjKey(that.defn.inputs, that.makePort, ports.InputPort);
    bb.forEachObjKey(that.defn.outputs, that.makePort, ports.OutputPort);
  };

  // this.ports.get = function (portName) {
  //   if (this.ports.hasOwnProperty(portName)) {
  //     return this.ports[portName];
  //   }
  //   else {
  //     return 0; // FIXME: This should die more silently than calling portName.get(), but less silently than just returning meaningless values.
  //   }
  // };
  
  nodeList[this.id] = this;
  init();

  if (this.defn.initFn) {
    // VERIFY: Change this.nodeName to this.id?
    this.defn.initFn(this.ports, this.nodeState, this.nodeName, emt);
  }

  this.tickListener = function (evt, tickData) {
    if (typeof that.defn.tick === 'function' && !that.muted) {
      that.defn.tick(that.ports, that.nodeState, that.id, tickData, that.defn);
    }
  };

  emt.on("global-tick", this.tickListener);
  
  if (typeof this.defn.hrTick === "function") {
    this.hrTickListener = function (evt, tickData) {
      if (!that.muted) {
        that.defn.hrTick(that.ports, that.nodeState, that.id, tickData, that.defn);
      }
    };
    emt.on("global-hr-tick", this.hrTickListener);
  }
};

MapNode.prototype.installDefn = function (defn) {
  var emt = this.defn.emitter;
  
  this.nodeState.runningState = MapNode.RunningState.STOPPED;
  if (typeof this.defn.destroy === 'function') {
    this.defn.destroy(this.ports,this.nodeState);
  }
  
  this.defn = defn;
  this.defn.emitter = emt;
  
  // convoluted way of preserving connections
  for (var pn in this.ports) {
    if (!this.defn.inputs.hasOwnProperty(pn) && !this.defn.outputs.hasOwnProperty(pn)) {
      this.removePort(pn);
    }
  }
  for (var pn in this.defn.inputs) {
    if (!this.ports.hasOwnProperty(pn)) {
      this.makePort(pn, this.defn.inputs[pn], ports.InputPort);
    }
  }
  for (var pn in this.defn.outputs) {
    if (!this.ports.hasOwnProperty(pn)) {
      this.makePort(pn, this.defn.outputs[pn], ports.OutputPort);
    }
  }

  if (typeof this.defn.initFn === 'function') {
    // VERIFY: Change this.nodeName to this.id?
    this.defn.initFn(this.ports, this.nodeState, this.nodeName, emt);
  }
  // this.clearPorts();
  // bb.forEachObjKey(this.defn.inputs, this.makePort, ports.InputPort);
  // bb.forEachObjKey(this.defn.outputs, this.makePort, ports.OutputPort);
};

Object.defineProperty(MapNode.prototype, "nodeName", {
  get: function () {
    if (this._nodeName) {
      if (this.defn.nodeName && (this._nodeName !== this.defn.nodeName)) {
        return this._nodeName + " (" + this.defn.nodeName + ")";
      }
      else {
        return this._nodeName;
      }
    }
    else {
      return this.defn.nodeName || "";
    }
  },
  set: function (nameStr) {
    this._nodeName = nameStr;
    console.log("Set nodeName: " + nameStr);
    if (this.defn && this.defn.emitter) {
      console.log("sending set-node-name");
      this.defn.emitter.emit("configured-node", "configured-node", {
        "action": "set-node-name",
        "container": this.parent.id,
        "id": this.id,
        "nodeName": nameStr
      });
    }
  }
});

MapNode.prototype.removePort = function (portName) {
  delete mapNodesByPortId[this.ports[portName].id];
  delete portList[this.ports[portName].id];
  delete this.ports[portName];
};
/*
MapNode.prototype.clearPorts = function () {
  for (var portName in this.ports) {
    this.removePort(portName);
  }
};
*/
MapNode.prototype.makePort = function (name, params, portObj) {
  //console.log("Making Port");
  //if (params['type'] != ports.Type.EXT) {
  this.ports[name] = new portObj(this, params, null, name);
  mapNodesByPortId[this.ports[name].id] = this;
  portList[this.ports[name].id] = this.ports[name];
  //}
};

MapNode.prototype.getId = function () {
  return this.id;
};

MapNode.prototype.process = function (triggerPort) {
//  var now = Date.now();
//  if (this.defn.debounce && ((Date.now() - this.lastUpdate) < DEBOUNCE_INTERVAL)) {
//    return;
//  }
  if (this.muted || !this.defn.procfn) {
    return;
  }
  if (this.defn.generator && this.nodeState.runningState === MapNode.RunningState.INIT || !this.defn.generator) {
    // this.nodeState = this.defn.procfn(this.ports, this.nodeState, this.id, triggerPort, this.defn.emitter) || this.nodeState;
    this.defn.procfn(this.ports, this.nodeState, this.id, triggerPort, this.defn.emitter);
  }
};

MapNode.prototype.destroy = function () {
  this.parent = null;
  this.nodeState.runningState = MapNode.RunningState.STOPPED;
  if (typeof this.defn.destroy === 'function') {
    this.defn.destroy(this.ports,this.nodeState);
  }
  this.nodeState = null;
  MapNode.removeNodeFromList(this);
  this.defn.emitter.removeListener("global-tick", this.tickListener);
};

MapNode.addPortToList = function (port) {
  //Adds a port to the universal port list
  portList[port.id] = port;
};

MapNode.addNodeToList = function (node) {
  nodeList[node.id] = node;
};

MapNode.removeNodeFromList = function (node) {
  if (typeof node === 'string') {
    delete nodeList[node];
  }
  else {
    delete nodeList[node.id];
  }
};

MapNode.getMapNodeById = function (id) {
  return nodeList[id];
};

MapNode.getMapNodeByPortId = function (id) {
  return mapNodesByPortId[id];
};

MapNode.getPortById = function (id) {
  return portList[id];
};

MapNode.prototype.getPorts = function () {
  var ports = {
    inputs: {},
    outputs: {}
  };
  bb.forEachObjKey(this.ports, function (k, v) {
    if (v.direction == PortDirection.INPUT) {
      ports.inputs[k] = {id: v.id, value: v.value, type: v.type, fixed: v.fixed, published: v.published, editor: v.editor, continuous: v.continuous};
      if (v.enum) {
        ports.inputs[k].enum = v.enum;
      }
//     ports.inputs[k] = v.id;
    }
    else {
      ports.outputs[k] = {id: v.id, value: v.value, type: v.type, editor: v.editor, fixed: v.fixed};
//      ports.outputs[k] = v.id;
    }
  });
  return ports;
};

MapNode.prototype.getRoot = function () {
  var parent = this;
  while (parent.parent) {
    parent = parent.parent;
  }
  return parent;
};

MapNode.prototype.serialize = function () {
  var p = this.getPorts();
  var serdef = {
    nodetype: this.defn.nodetype,
    descr: this.defn.descr,
    x: this.x,
    y: this.y,
    id: this.id,
    inputs: p.inputs,
    outputs: p.outputs,
    nodeName: this._nodeName
  };
  
  if (!ComputeModules.getModules().hasOwnProperty(this.defn.nodetype)) {
    if (this.defn.hasOwnProperty("uiDefn")) {
      serdef.uiDefn = this.defn.uiDefn;
    }
    if (this.defn.hasOwnProperty("initFn")) {
      serdef.initFnStr = this.defn.initFn.toString();
    }
    if (this.defn.hasOwnProperty("tick")) {
      serdef.tickStr = this.defn.tick.toString();
    }
    serdef.procfnStr = this.defn.procfn.toString();
    serdef.parentDefn = this.defn.parentDefn;
  }
  if (this.muted) {
    serdef.muted = true;
  }
  return serdef;
};

MapNode.prototype.receiveEvent = function (refcon) {
  if (this.defn.receiveEvent) {
    this.defn.receiveEvent(this.ports, this.nodeState, refcon);
  }
};

MapNode.prototype.getPath = function () {
    var path = this._nodeName;
    if (!path && this.defn) {
        path = this.defn.nodetype;
    }
    if (this.parent) {
        return this.parent.getPath() + "/" + path;
    } else {
        return path;
    }
};

MapNode.RunningState = bb.defineEnum(["init", "running", "stopped"]);

module.exports = MapNode;
