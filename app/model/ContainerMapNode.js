'use strict';

var bb = require("./benb_utils.js");
var l = require("./log.js");
var path = require("path");
var MapNode = require("./MapNode.js");
var ComputeModules = require("./ComputeModules.js").getInstance();
var OscDeviceModules = require("./OscDeviceModules.js");
var OscReceiveNode = require('./OscReceiveNode.js');
var OscSendNode = require('./OscSendNode.js');

var PortDirection = require("./ports.js").Direction;
var Connection = require("./Connection.js");
var PortType = require("./ports.js").Type;
var events = require("events");
var fs = require("fs");
var EMITTER = new events.EventEmitter();
// OscDeviceModules = new OscDeviceModules();

var isRootPatchGlobal = true;


// We don't want warnings about possible memory leaks. We (think) we're adding all of the listeners we actually want.
EMITTER.setMaxListeners(0);

/* TODO:
    - Have all ports emit events when updating
    - Check node type when nodes are added. If inlet or outlet, add
      Type.EXT to map ports list.
    - Allow ContainerMapNode to be instantiated like a map node (maybe with a dummy node defn?)
  */

// FIXME: Define methods on the prototype.

var ContainerMapNode = function (defn, id, parent, x, y) {
  // events.EventEmitter.call(this);

  var connections = {};
  var mapNodes = {};
  var that = this;
  var isRootPatch = isRootPatchGlobal;
  if (isRootPatch) {
    isRootPatchGlobal = false;
  }

//  var mapNodesByName = {};
  
  this.ports = {};
  this.publishedPortList = {};

  this.id = (id == null) ? bb.uuid() : id;
  id = this.id; // Fix from Andrew
  this.parent = parent;
  var xm = (defn) ? defn.x : 0;
  var ym = (defn) ? defn.y : 0;
  this.x = x || xm;
  this.y = y || ym;
  this._nodeName = (defn) ? defn.nodeName : "";


  this.on = function (evt, cb) {
    EMITTER.on(evt, cb);
  };

  this.emit = function (evt, data) {
    EMITTER.emit(evt,evt,data);
  };
  
  this.removeListener = function (evt, cb) {
    EMITTER.removeListener(evt, cb);
  };

  this.createNode = function (defn, id, x, y, fileRef) {
    var defnStr;
    if (typeof defn === 'string') {
      var cms = ComputeModules.getModules();
      defnStr = defn;
      defn = cms[defn] || defn; // This is going to bite us in the ass.
    }

    var cm;
    if (defn.nodetype === "ContainerMapNode" || defn === "ContainerMapNode") {
      cm = new ContainerMapNode(defn, id, this, x, y);
      //console.log("CREATED CONTAINER MAP NODE", cm);
      if (fileRef) {
        cm.fileRef = fileRef;
        cm.nodeName = fileRef.substring(Math.max(fileRef.lastIndexOf('/'), fileRef.lastIndexOf('\\')) + 1, fileRef.lastIndexOf('.'));
      }
      else if (defnStr && defn.nodetype !== defnStr) {
        cm.nodeName = defnStr.substring(0, defnStr.lastIndexOf('.'));
      }
      mapNodes[cm.id] = cm;
      MapNode.addNodeToList(cm);
    }
    else if (defn.deviceType) {

      if (defn.deviceType === "SND") {
        var odm = OscDeviceModules[defn.nodetype];
        // console.log(odm);
        cm = new OscSendNode(null, odm, odm.defaultPort, odm.defaultHost, defn.x, defn.y);
        mapNodes[cm.id] = cm;
      }
      else if (defn.deviceType === "RCV") {
        var odm = OscDeviceModules[defn.nodetype];
        // console.log(defn);
        cm = new OscReceiveNode(null, odm, odm.defaultPort, odm.defaultHost, defn.x, defn.y);
        mapNodes[cm.id] = cm;
        cm.parent = this;
      }
      else {
        throw new Error("Unknown device type!");
      }

    }
    else {
      cm = new MapNode(defn, id, x, y, EMITTER);
      mapNodes[cm.id] = cm;
      // mapNodesByName[cm.nodeName] = cm; // FIXME: Merged from grandari, but will break if node is renamed (leaking node and unable to reference by new name unless we remove and re-add it).
      cm.defn.emitter = EMITTER;

      if (cm.defn.nodetype === "Inlet") {
        //l.debug(this)
        if (cm.defn.inputs.i1.type != PortType.EXT) {
          l.error("Port type wrong for inlet. i1 on this port is " + cm.ports.o1.type);
        }
        //l.debug(that);
        // console.log("EXT I1", cm.defn.inputs.i1);
        this.ports[cm.nodeName] = cm.ports.i1;
        //that.makePort("in-" + cm.nodeName, cm.defn.inputs.i1, Port.InputPort, cm);

      }

      if (cm.defn.nodetype === "Outlet") {
        if (cm.defn.outputs.o1.type != PortType.EXT) {
          l.error("Port type wrong for outlet. o1 on this port is " + cm.ports.o1.type);
        }
        this.ports[cm.nodeName] = cm.ports.o1;
        //that.makePort("out-" + cm.nodeName, cm.defn.outputs.o1, Port.OutputPort, cm);
      }

//      l.log("debug", "Created node " + cm.id);
    }

    EMITTER.emit('mapping-changed', 'mapping-changed', {
      "action": "add-node",
      "container": this.id,
      "nodeSpec": cm.serialize()
    });
    
    cm.parent = this;
    return cm.id;
  };

  // creating a device node
  this.createDeviceNode = function (device, id, x, y) {
    mapNodes[device.id] = device;
    EMITTER.emit('mapping-changed', 'mapping-changed', {
      "action": "add-node",
      "container": this.id,
      "nodeSpec": device.serialize()
    });
  };

  this.destroy = function () {
    this.removeAll();
    MapNode.removeNodeFromList(this);
  };
  
  this.removeAll = function () {
    bb.forEachObjKey(mapNodes, function (id, node) {
      this.removeNode(id);
    }.bind(this));
  };

  this.removeNode = function (id) {

    mapNodes[id].destroy();

    if (!mapNodes.hasOwnProperty(id)) {
      l.info("Tried to remove node that does not exist. Ingoring. " + id);
      return;
    }
    //For all ports in the object
    bb.forEachObjKey(mapNodes[id].ports, function (name, port) {
      //console.log("trying to unpublish " + port.id);
      EMITTER.emit('mapping-changed', 'mapping-changed', {
        "action": "toggle-publish-port",
        "container": this.id,

        "id": port.id,
        "publish": false
      });

      //And all connections on each port
      if (name === "get") { 
        return; //allows delete to work despite hacked get()
      }
      bb.forEachObjKey(port.connections, function (cid, conn) {
        //remove those connections from our global connection list
        delete connections[conn.id];
        //and have the connections remove themselves from associated nodes
        conn.destroy();
      });
    });

    //Remove external ports if node is a "*let"
    if (mapNodes[id].defn) {
      if (mapNodes[id].defn.nodetype === "Inlet") {
        delete this.ports["in-" + id];
      }

      if (mapNodes[id].defn.nodetype === "Outlet") {
        delete this.ports["out-" + id];
      }
    }

    EMITTER.emit('mapping-changed', 'mapping-changed', {
      "action": "remove-node",
      "container": this.id,
      "node": id
    });
    //Remove node
    delete mapNodes[id];
  };

  this.moveNode = function (id, x, y) {
    var node = mapNodes[id];
    node.x = x;
    node.y = y;
  };
  
  this.selectNodes = function (nodeIds) {
    ContainerMapNode.selection = {nodes: {}, connections: {}};
    nodeIds.forEach(function (nid) {
      var node = MapNode.getMapNodeById(nid);
      ContainerMapNode.selection.nodes[nid] = node.serialize();
      bb.forEachObjKey(node.ports, function (portId, port) {
        bb.forEachObjKey(port.connections, function (key, conn) {
          ContainerMapNode.selection.connections[key] = {
            o: conn.outputPort.id,
            i: conn.inputPort.id
          };
        });
      });
    });
  };
  
  this.pasteCopiedNodes = function (x, y) {
    if (ContainerMapNode.selection && ContainerMapNode.selection.nodes) {
      var minX = 1200, minY = 1200; // We don't want to use Infinity, otherwise (just in case) nodes will be pasted outside of the scroll area.
      // LATER: Find a better way to handle this without needing to know the view's dimensions. Maybe mapping dimensions are a property of CMN.
      // send it with the paste command.

      bb.forEachObjKey(ContainerMapNode.selection.nodes, function (nodeId, node) {
        node.x += 100;
        node.y += 100;
      });
      var newIds = this.constructFromObj(ContainerMapNode.selection);
      if (newIds) {
        EMITTER.emit('mapping-changed', 'mapping-changed', {
            "action": "selected-nodes",
            "container": that.id,
            "selected": newIds
          });
      }
    }
  };

  this.nestCopiedNodes = function () {
    var minX = 1200, minY = 1200, maxX = 0, maxY = 0;
    bb.forEachObjKey(ContainerMapNode.selection.nodes, function (nodeId, node) {
      if (node.x <= minX && node.y <= minY) {
        minX = node.x;
        minY = node.y;
      }
      maxX = Math.max(node.x, maxX);
      maxY = Math.max(node.y, maxY);
    });
    bb.forEachObjKey(ContainerMapNode.selection.nodes, function (nodeId, node) {
//      node.x -= minX + 100;
//      node.y -= minY + 100;
      node.x += 100;
      node.y += 100;
    });
    var cmid = this.createNode("ContainerMapNode", null, minX + (maxX - minX) / 2, minY + (maxY - minY) / 2);
    var cm = MapNode.getMapNodeById(cmid);
    cm.constructFromObj(ContainerMapNode.selection, true);
    
    // TODO: create internal Inlet and Outlet nodes for broken connections, connect them, then reconnect the nodes in the outer patch.
  };
  
  this.rebuildUI = function () {
//    console.log("ID!!!", this.id);
    var containerID = this.id;
    //Doesn't actually change the mapping, only removes and sends all nodes and connections.
    // bb.forEachObjKey(connections, function (id, connection) {
    //   EMITTER.emit('mapping-changed', 'mapping-changed', {
    //     "action": "remove-connection",
    //     "container": containerID,
    //     "connection": id,
    //     "sourceId":connection.getElements().source.id,
    //     "targetId":connection.getElements().target.id
    //   });
    // });

    bb.forEachObjKey(connections, function (id, connection) {
      MapNode.getPortById(connection.getPortIDs().source).sendUpdates = false;
      MapNode.getPortById(connection.getPortIDs().target).sendUpdates = false;
      //console.log(MapNode.getPortById(connection.getPortIDs().source));
    });

    bb.forEachObjKey(mapNodes, function (id, node) {
      EMITTER.emit('mapping-changed', 'mapping-changed', {
        "action": "remove-node",
        "container": containerID,
        "node": node.id,
        "uiOnly": true
      });

      EMITTER.emit('mapping-changed', 'mapping-changed', {
        "action": "add-node",
        "container": containerID,
        "nodeSpec": node.serialize()
      });
    });


    bb.forEachObjKey(connections, function (id, connection) {
      EMITTER.emit('mapping-changed', 'mapping-changed', {
        "action": "add-connection",
        "container": containerID,
        "connection": id,
        "sourceId": connection.getPortIDs().source,
        "targetId": connection.getPortIDs().target
      });
    });

  };
  
  this.rebuildUINode = function(nodeId) {
    // Rebuild the UI only for the specified node and its connections
    var containerID = this.id;
    var node = (typeof nodeId === "string") ? mapNodes[nodeId] : nodeId;
    
    if (node) {

      // find connections for node and set sendUpdates = false
      bb.forEachObjKey(node.ports, function (pid, port) {
        bb.forEachObjKey(port.connections, function (cid, connection) {
          MapNode.getPortById(connection.getPortIDs().source).sendUpdates = false;
          MapNode.getPortById(connection.getPortIDs().target).sendUpdates = false;
        });
      });

      EMITTER.emit('mapping-changed', 'mapping-changed', {
        "action": "remove-node",
        "container": containerID,
        "node": node.id,
        "uiOnly": true
      });

      EMITTER.emit('mapping-changed', 'mapping-changed', {
        "action": "add-node",
        "container": containerID,
        "nodeSpec": node.serialize()
      });
      
      bb.forEachObjKey(node.ports, function (pid, port) {
        bb.forEachObjKey(port.connections, function (cid, connection) {
          EMITTER.emit('mapping-changed', 'mapping-changed', {
            "action": "add-connection",
            "container": containerID,
            "connection": cid,
            "sourceId": connection.getPortIDs().source,
            "targetId": connection.getPortIDs().target
          });
        });
      });
    }
  };

  this.connectByPortId = function (outputId, inputId) {
//    l.debug("Creating connection!", outputId, inputId);
    var c = new Connection(MapNode.getPortById(outputId), MapNode.getPortById(inputId));

    // if (this.defn.variadicInput && ) {
    // and this is the "last" port that's being connected
//      var name = this.port
    // get its name, look for a integer at the end of the name
    //   if there isn't one, add a 1
    //   if there is one, increment it and append it to the string
    // create a new port with the new name
    // rebuildUI(); (or the node...)
    // }
    
    if (c) {
      connections[c.id] = c;
      EMITTER.emit('mapping-changed', 'mapping-changed', {
        "action": "add-connection",
        "container": this.id,
        "connection": c.id,
        "sourceId": outputId,
        "targetId": inputId
      });
      return c.id;
    }
  };

  this.getConnectionElements = function (connectionId) {
    return connections[connectionId].getElements();
  };

  this.connectByNodeIdPortName = function (oNodeId, oPortName, iNodeId, iPortName) {

    //console.log("CN BY ID NAME", iNodeId);
    if (mapNodes[oNodeId] === undefined) {
      throw new Error("Tried to connect bad output node id!");
    }
    if (mapNodes[oNodeId].ports[oPortName] === undefined) {
      throw new Error("Tried to connect bad output port name! " + oPortName);
    }
    if (mapNodes[iNodeId] === undefined) {
      throw new Error("Tried to connect bad input node id!");
    }
    if (mapNodes[iNodeId].ports[iPortName] === undefined) {
      throw new Error("Tried to connect bad input port name!");
    }

    return this.connectByPortId(mapNodes[oNodeId].ports[oPortName].id, mapNodes[iNodeId].ports[iPortName].id);
  };

  this.disconnectPorts = function (connectionId, s, t) {
    if (connections.hasOwnProperty(connectionId)) {
      connections[connectionId].destroy();
      delete connections[connectionId];
      EMITTER.emit('mapping-changed', 'mapping-changed', {
        "action": "remove-connection",
        "container": this.id,
        "connection": connectionId,
        "sourceId": s,
        "targetId": t
      });
    } else {
      //This is due to a bug in jsplum where moving a connection
      //without dropping it causes the connection to be detached
      //on the back but no the front. 
      console.log("--!!Got a remove event for connection that doesn't exist! - See ContainerMapNode line 296");
    }
  };

  this.serialize = function () {
    var p = this.getPorts();
    var mapping = {
      id: this.id,
      nodes: {},
      connections: {},
      inputs: p.inputs,
      outputs: p.outputs,
      nodetype: "ContainerMapNode",
      nodeName: this._nodeName,
      descr: "A container for a sub mapping.",
      x: this.x,
      y: this.y
    };

    // All nodes in mapping
    bb.forEachObjKey(mapNodes, function (id, node) {
      mapping.nodes[id] = node.serialize();
    }.bind(this));

    // All connections in mapping
    bb.forEachObjKey(connections, function (id, conn) {
      mapping.connections[id] = {
        o: conn.outputPort.id,
        i: conn.inputPort.id
      };
    });

    if (this.fileRef) {
      mapping.fileRef=this.fileRef;
    }
    
    return mapping;
  };

  this.requestPortUpdatesById = function (portId) {
    //console.log(MapNode.getPortById(portId));
    MapNode.getPortById(portId).sendUpdates = this.id;
    MapNode.getPortById(portId).editor = true;
    MapNode.getPortById(portId).emit();
  };

  this.cancelPortUpdatesById = function (portId) {
    MapNode.getPortById(portId).sendUpdates = false;
    MapNode.getPortById(portId).editor = false;
  };

  this.getPortsByMapNodeId = function (id) {
    var ports = {
      inputs: {},
      outputs: {}
    };
    bb.forEachObjKey(mapNodes[id].ports, function (k, v) {
      if (v.direction == PortDirection.INPUT) {
        ports.inputs[k] = v.id;
      }
      else {
        ports.outputs[k] = v.id;
      }
    });
    return ports;
  };

  this.setValueByNodeIdPortName = function (nodeId, portName, val) {
    return mapNodes[nodeId].ports[portName].set(val);
  };

  this.setPublishedByNodeIdPortName = function (nodeId, portName, val) {
    var portId = mapNodes[nodeId].ports[portName].id;
    this.togglePublishPort(portId, val);
    return mapNodes[nodeId].ports[portName].setPublished(val);
  };
  
  this.setShowPortEditorByNodeIdPortName = function (nodeId, portName, showEditor) {
    var portId = mapNodes[nodeId].ports[portName].id;
    EMITTER.emit('mapping-changed', 'mapping-changed', {
      "action": "show-port-editor",
      "container": this.id,
      "id": portId,
      "editor": showEditor
    });
  };
  
  this.setValueByPortId = function (portId, val) {
    var port = MapNode.getPortById(portId);
    if (port != PortType.BUF) {
      // console.dir(port.getPath());
      // We cannot manually set buffers.
      return port.validateAndSet(val);
    } else {
      return false;
    }
  };
  
  this.resetValueByPortId = function (portId) {
    var p = MapNode.getPortById(portId);
    if (p.type != PortType.BUF) {
      // console.dir(p.getPath());
      // We cannot manually set buffers.
      return p.set(p.defaultValue);
    } else {
      return false;
    }
  };
  
  this.resetValuesSelected = function (nodeIds, filter) {
    nodeIds.forEach(function (id) {
      var node = MapNode.getMapNodeById(id);
      var port;
      if (node) {
        for (var pid in node.ports) {
          port = node.ports[pid];
          switch (filter) {
            case "open":
              if (port.sendUpdates) {
                port.reset();
              }
              break;
            case "closed":
              if (!port.sendUpdates) {
                port.reset();
              }
              break;
            case "connected":
              if (Object.keys(port.connections).length > 0) {
                port.reset();
              }
              break;
            case "all":
              /* falls through */
            default:
              port.reset();
              break;
          }
        }
      }
    });
  };

  this.setValueByPortPath = function (path, val) {
    for (var o in this.publishedPortList) {

      if (this.publishedPortList[o] == path) {
        this.setValueByPortId(o, val);
      }
    }
  };

  this.getPublishedPortList = function() {
    return this.getRoot().publishedPortList;
    // return this.publishedPortList;
  };

  this.getValueByNodeIdPortName = function (nodeId, portName) {
    return mapNodes[nodeId].ports[portName].value;
  };

  this.getPorts = function () {
    var ports = {
      inputs: {},
      outputs: {}
    };
    bb.forEachObjKey(this.ports, function (k, v) {
      if (v.direction == PortDirection.INPUT) {
        ports.inputs[k] = {id: v.id, value: v.value, published: v.published, editor: v.editor, fixed: v.fixed};
//        ports.inputs[k] = v.id;
      }
      else {
        // ports.outputs[k] = {id: v.id, value: v.value, editor: v.editor, fixed: v.fixed};
        ports.outputs[k] = {id: v.id, editor: v.editor, fixed: v.fixed}; // Removing output value, as it should not need to be persisted.
        // Except we might want it for parse-on-connection type changes, since there's no guarantee that the node's procfn/tick got called.
//        ports.outputs[k] = v.id;
      }
    });
    return ports;
  };

  this.getMapNodes = function () {
    return mapNodes;
  };

  this.getPortsByPath = function (path) {
//    var returnPorts = [];
//    bb.forEachObjKey(ports, function (id, port) {
//      console.log("Ports: ", id, port.getPath());
//    });
  };

  this.togglePublishPort = function(portId, _publish) {
    var port = MapNode.getPortById(portId);
    var root = port.parent.getRoot();
    // var root = this;
    var published = (typeof root.publishedPortList[portId] !== 'undefined');
    var publish = (typeof _publish !== 'undefined') ? _publish : !published;
    port.published = publish;
    var returnValue;
    // console.log("root", root.id);
    if (!publish) {
      delete root.publishedPortList[portId];
      // delete this.publishedPortList[portId];
      // console.log("PORT UNPUBLISHED: " + portId);
      returnValue = false;
    } else {
      // console.log("***", root.id, root.publishedPortList);
      root.publishedPortList[portId] = port.getPath();
      // this.publishedPortList[portId] = MapNode.getPortById(portId).getPath();
      // console.log("PORT PUBLISHED: " + portId);
      returnValue = true;
    }
    EMITTER.emit('mapping-changed', 'mapping-changed', {
      "action": "toggle-publish-port",
      "container": this.id,
      "id": portId,
      "published": returnValue,
    });
    return returnValue;
  };

this.mapNodeUIEvent = function(refcon) {
  // console.log("Got map node ui", refcon);
  // mapNodesByName[refcon.name].receiveEvent(refcon);
  mapNodes[refcon.id].receiveEvent(refcon);
};

this.constructFromObj = function (obj, addStarlets) {
  var newNodesByExisitingPortId = {};
  var newIds = [];
  bb.forEachObjKey(obj.nodes, function (id, node) {
    var that = this;
    node.copy = this.createNode(node);
    newIds.push(node.copy);
    // console.log("NODE COPY", node.copy);
    //Get all input port ids, store node by those ids, so we can look up
    bb.forEachObjKey(node.inputs, function (name, portData) {
      if (typeof portData === 'string') {
        // legacy parsing of existing mappings serialized without port values
        newNodesByExisitingPortId[portData] = {
          nodeId: node.copy,
          portName: name,
        };
      }
      else {
        newNodesByExisitingPortId[portData.id] = {
          nodeId: node.copy,
          portName: name,
        };
        try {
          if (node.inputs[name].type == PortType.BUF) {
            that.setValueByNodeIdPortName(node.copy, name);
          }
          else {
            that.setValueByNodeIdPortName(node.copy, name, portData.value);
            var published = (portData.published) ? portData.published : false;
            that.setPublishedByNodeIdPortName(node.copy, name, published);
            // node.inputs[name].editor = portData.editor;
            if (portData.editor) {
              that.setShowPortEditorByNodeIdPortName(node.copy, name, portData.editor);
            }
          }
        }
        catch (ex) {
          console.warn("Conflict with serialized node type (or lack thereof).");
        }
      } 
    });
    //Same for outputs
    bb.forEachObjKey(node.outputs, function (name, portData) {
      if (typeof portData === 'string') {
        // legacy parsing of existing mappings serialized without port values
        newNodesByExisitingPortId[portData] = {
          nodeId: node.copy,
          portName: name,
        };
      }
      else {
        newNodesByExisitingPortId[portData.id] = {
          nodeId: node.copy,
          portName: name,
        };
        // node.outputs[name].editor = portData.editor;
        if (portData.editor) {
          that.setShowPortEditorByNodeIdPortName(node.copy, name, portData.editor);
        }
      } 
    });
    return newNodesByExisitingPortId;
  }.bind(this));

  var offset = 1;
  var spacing = 40;
  
  bb.forEachObjKey(obj.connections, function (id, conn) {
    var newOutput = newNodesByExisitingPortId[conn.o];
    var newInput = newNodesByExisitingPortId[conn.i];
    // l.debug("nodeIds: ", newOutput, newInput);
	if (addStarlets) {
      if (!mapNodes[newOutput] && newInput) {
        var inlet = this.createNode("Inlet", null, 100, spacing * offset);
        inlet = mapNodes[inlet];
        inlet.nodeName = newInput.portName + "_" + offset;
        // newNodesByExisitingPortId[conn.i] = {nodeId: inlet.id, portName: "o1"};
        replaceEntries(newNodesByExisitingPortId, newOutput, {nodeId: inlet.id, portName: "o1"});
        this.connectByNodeIdPortName(inlet.id, "o1", newInput.nodeId, newInput.portName);
        // this.parent.connectByNodeIdPortName(newNodesByExisitingPortId[conn.o].nodeId, newNodesByExisitingPortId[conn.o].portName, this.id, inlet.nodeName);
        offset++;
      }
      else if (!mapNodes[newInput] && newOutput) {
        var outlet = this.createNode("Outlet", null, 1100, spacing * offset++);
        outlet = mapNodes[outlet];
        outlet.nodeName = newOutput.portName + "_" + offset;
        // newNodesByExisitingPortId[conn.o] = {nodeId: outlet.id, portName: "i1"};
        replaceEntries(newNodesByExisitingPortId, newInput, {nodeId: outlet.id, portName: "i1"});
        this.connectByNodeIdPortName(newOutput.nodeId, newOutput.portName, outlet.id, "i1");
        // this.parent.connectByNodeIdPortName(newNodesByExisitingPortId[conn.i].nodeId, newNodesByExisitingPortId[conn.i].portName, this.id, outlet.nodeName)
        offset++;
      }
      else {
        try {
          conn.copy = this.connectByNodeIdPortName(newOutput.nodeId, newOutput.portName, newInput.nodeId, newInput.portName);
        }
        catch (ex) {
          console.warn("Could not find previously connected port with nodeId: " + newOutput + "->" + newInput);
        }
      }
    }
    else {
      try {
        conn.copy = this.connectByNodeIdPortName(newOutput.nodeId, newOutput.portName, newInput.nodeId, newInput.portName);
      }
      catch (ex) {
        console.warn("Could not find previously connected port with nodeId: " + newOutput + "->" + newInput);
        // this.disconnectPorts(id);
      }
    }
  }.bind(this));

  if (offset > 1) {
    this.parent.rebuildUI();
  }
  return newIds;
};
  
function replaceEntries(coll, oldValue, newValue) {
  for (var i in coll) {
    if (coll[i] == oldValue) {
      coll[i] = newValue;
    }
  }
}

  //We'll override the make port function for a container to ONLY 
  //create ports that have an external type
  // this.makePort = function(name, params, portObj, parentNode) {
  //   //l.debug(params);
  //   //console.log("HERE?");
  //   if (params['type'] == PortType.EXT) {
  //     this.ports[name] = new portObj(parentNode, params);
  //     MapNode.addPortToList(this.ports[name]);
  //     //portList[this.ports[name].id] = this.ports[name];
  //     //mapNodesByPortId[this.ports[name].id] = this;
  //   }
  // };

    //If there's a reference to a file, 
  //load CMN defn from it. 
  if (defn && defn.hasOwnProperty("fileRef")) {
    var origId = defn.id;
    var f = (defn.fileRef.indexOf(path.sep) < 0) ? __dirname + "/../maps/" + defn.fileRef : defn.fileRef;
    that.fileRef = defn.fileRef;
    // console.log("FOUND FILE FOR ContainerMapNode", f);
    defn = JSON.parse(fs.readFileSync(f, 'utf-8'));
    //We need to preserve the ID from the existing mapping, so connections
    //can be made to and from in/outlets
    // console.log("Replacing IDs", defn.id, origId);
    defn.id = id || origId;
    this.id = id || origId;
    // l.debug("LOADED NEW CMN DEFN", defn);
    //If the definition passed in includes a map,
    //add all the modules and connections of that map
    //to this one.
  }
  if (defn && defn.hasOwnProperty('nodes')) {
    //console.log("constructing container map node!");
    //console.log(mapdefn);
    this.defn = defn;
    this.constructFromObj(defn);
  }
};

// ContainerMapNode.selection = new Set();

ContainerMapNode.buildFromJSON = function (json) {
  //naive strategy for copying, attach a copy property to each
  //node and connection with a clone of that element
  //use the existing json to figure out how connections
  //should be attached
  return ContainerMapNode.buildFromDefn(JSON.parse(json));
};

ContainerMapNode.buildFromDefn = function (obj) {
  var mapCopy = new ContainerMapNode();
  mapCopy.constructFromObj(obj);
  return mapCopy;
};

ContainerMapNode.prototype = Object.create(MapNode.prototype);
ContainerMapNode.prototype.constructor = ContainerMapNode;

module.exports = ContainerMapNode;
