var bb = require("./benb_utils.js");
var l = require("./log.js")
var MapNode = require("./MapNode.js");
var ContainerMapNode = require("./ContainerMapNode.js");
var PortDirection = require("./ports.js").Direction;
var Connection = require("./Connection.js")
var ComputeModules = require("./ComputeModules.js");
var PortType = require("./ports.js").Type;

var CueListContainerMapNode = function(mapdefn,id) {
  var connections = {};
  var mapNodes = {};
  var availablePortsByNode = {};

  // Imposes an order and cuing metadata on the child ContainerMapNodes
  // This could be replaced with a sorted linked list
  var cueList = [];

  ContainerMapNode.call(this);

  this.ports = {};
  this.defn = (mapdefn == null) ? {nodetype: "CueListContainerMapNode", descr: "A container for a sub mapping."} : mapdefn;
  this.id = (id == null) ? bb.uuid() : id;

  @override
  this.createNode = function(defn,id) {
  	var cmid = this.parent.createNode(defn, id);
  	var cm = mapNodes[cmid];

    // Add a cue list entry
  	this.cueList.push({"cueName": "Cue " + id, "fadeTime": 0.0, "value": cmid});

    // For all ports currently in the CueListContainerMapNode
    // If the "equivalent" port does not exist in the created ContainerMapNode,
    //   create the port on the ContainerMapNode
    // Connect the inputs to the CueListContainerMapNode to the inputs of the ContainerMapNode
    // Connect the outputs of the ContainerMapNode to the outputs of the CueListContainerMapNode
    // Insert interpolators between outputs
  	bb.forEachObjKey(this.ports, function (id, v) {
  		if (cm.getPorts().inputs.indexOf(id) > -1) {

  		}
  	});

    if (cm.defn.nodetype === "Inlet") {
      if (cm.ports.i1.type != PortType.EXT) {
        l.error("Port type wrong for inlet. i1 on this port is "+cm.ports.o1.type)
      }
      this.ports["in-"+cm.id] = cm.ports.i1;
    }

    if (cm.defn.nodetype === "Outlet") {
      if (cm.ports.o1.type != PortType.EXT) {
        l.error("Port type wrong for outlet. o1 on this port is "+cm.ports.o1.type)
      }
      this.ports["out-"+cm.id] = cm.ports.o1;
    }

    return cmid;
  }

  this.createDeviceNode = function(device) {
    throw "Cannot create DeviceNode directly to CueListContainerMapNode.";
  }

  // Inherited from ContainerMapNode
  // this.createContainerMapNode;

  @override
  this.removeNode = function(id) {
  	// Remove the cue entry from the cueList
  	Array.forEach(this.cueList, function (cue, index) {
  		if (cue.value === id) {
  			this.cueList.splice(index, 1);
  			break;
  		}
  	});

  	// Remove the node
  	this.parent.removeNode(id);
  }

  this.connectByPortId = function(outputId, inputId) {

    var c = new Connection(MapNode.getPortById(outputId), MapNode.getPortById(inputId));

    if (c) {
      connections[c.id] = c;
      return c.id;
    }
  }

  this.connectByNodeIdPortName = function(oNodeId, oPortName, iNodeId, iPortName) {

    var c = new Connection(mapNodes[oNodeId].ports[oPortName], mapNodes[iNodeId].ports[iPortName]);

    if (c) {
      connections[c.id] = c;
      return c.id;
    }

  }

  this.disconnectPorts = function(connectionId) {
    connections[connectionId].destroy();
    delete connections[connectionId];
  }

  // Inherited from ContainerMapNode
  // this.getFullMapping;

  this.getCytoscapeElements = function() {
    var map = this.getFullMapping();
    var output = {nodes : [], edges : []};

    bb.forEachObjKey(map.nodes, function(nodeId,node) {
      output.nodes.push({ data: {id: nodeId, name: nodeId}});
    });

    bb.forEachObjKey(map.connections, function(connId,conn) {
      var s = MapNode.getMapNodeByPortId(conn.o).id;
      var t = MapNode.getMapNodeByPortId(conn.i).id;
      output.edges.push({ data : { source : s, target : t}})
    });

    return output;

  }

  this.getPortsByMapNodeId = function(id) {
    var ports = {inputs:{}, outputs:{}}
    bb.forEachObjKey(mapNodes[id].ports, function(k,v) {
      if (v.direction == PortDirection.INPUT) {
        ports.inputs[k]=v.id;
      } else  {
        ports.outputs[k]=v.id;
      }
    })
    return ports;
  }

  this.setValueByNodeIdPortName = function(nodeId,portName,val) {
    return mapNodes[nodeId].ports[portName].set(val);
  }

  this.getValueByNodeIdPortName = function(nodeId,portName) {
    return mapNodes[nodeId].ports[portName].value
  }

  this.getJSONByMapNodeId = function(id) { //TEMPORARY FUNCTION
    return mapNodes[id].getJSON();
  };

  this.constructFromObj = function(obj) {
    console.log(obj);
    var that = this;
    var newNodesByExisitingPortId = {};
    bb.forEachObjKey(obj.nodes, function(id, node) {
      console.log("NODETYPE "+node.nodetype)
      if (node.nodetype === "ContainerMapNode") {
        node.copy = this.createNodeContainer(node.map);
      } else {
        node.copy = this.createNode(ComputeModules[node.nodetype]);
      }

      //Get all input port ids, store node by those ids, so we can look up
      bb.forEachObjKey(node.ports.inputs, function(name, portId) {
        newNodesByExisitingPortId[portId] = { nodeId : node.copy, portName: name};
      });
      //Same for outputs
      bb.forEachObjKey(node.ports.outputs, function(name, portId) {
        newNodesByExisitingPortId[portId] = { nodeId : node.copy, portName: name};
      });

    }.bind(this));

    bb.forEachObjKey(obj.connections, function(id, conn){
      var newOutput = newNodesByExisitingPortId[conn.o]
      var newInput = newNodesByExisitingPortId[conn.i]
      conn.copy = this.connectByNodeIdPortName(newOutput.nodeId, newOutput.portName, newInput.nodeId, newInput.portName);
    }.bind(this));

  }

  //If the definition passed in includes a map,
  //add all the modules and connections of that map
  //to this one.
  console.log(this.defn);
  if (this.defn.hasOwnProperty('nodes')) {
    this.constructFromObj(this.defn);
  }
};

CueListContainerMapNode.buildFromJSON = function(json) {
  //naive strategy for copying, attach a copy property to each
  //node and connection with a clone of that element
  //use the existing json to figure out how connections
  //should be attached
  var originalMap = JSON.parse(json);
  var mapCopy = new CueListContainerMapNode();
  mapCopy.constructFromObj(originalMap);
  return mapCopy;
};


CueListContainerMapNode.prototype = Object.create(ContainerMapNode);
CueListContainerMapNode.prototype.constructor = CueListContainerMapNode;
CueListContainerMapNode.prototype.parent = ContainerMapNode.prototype;

module.exports = CueListContainerMapNode;
