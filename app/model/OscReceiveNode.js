//Version of MapNode that is an Osc Device

osc = require('osc-min');
udp = require("dgram");
//bb = require('./benb_utils.js');
var ports = require('./ports.js');
var Type = ports.Type;
var l = require("./log.js");
var bb = require("./benb_utils.js");
var PortDirection = require("./ports.js").Direction;
var MapNode = require("./MapNode.js");


var nodeList = {};
var portList = {};
//var portsByAddress = {}; // of the form {address: [port1, port2]}
var mapNodesByPortId = {};

//console.log("Objlen!! "+Object.keys(outputsDef).length);

var OscDeviceNode = function(id, defn, recv_port, ip_address, x, y, out_socket) {

  console.log("Creating OSC Device");

  var that = this;
  this.id = (id == null) ? bb.uuid() : id;
  this.ports = {};
  this.nodeState = null;
  this.updateNum = 0;
  this.receivedNum = 0;
  this.watchdogCount = this.receivedNum;
  this.portsByAddress = {};
  this.nodeName = null;
  this.ip = ip_address;
  this.recv_port = recv_port;

  this.defn = defn;
  this.x = x || 0;
  this.y = y || 0;

  this.makeAllPorts(this.defn); //Make all the needed ports

  nodeList[this.id] = this;

  this.recv_socket = udp.createSocket("udp4", function(msg, rinfo){
			that.parseMsg(msg);
      that.receivedNum++;
  });
  
  this.recv_socket.bind(recv_port);
  console.log(this.recv_socket);

  this.out_socket = out_socket || this.recv_socket;


  //watchdogCheckTime = 50;
  //this.watchdogObj = setInterval(this.watchdog.bind(this), watchdogCheckTime);

  if (this.defn.subscribeMsg) {
    setInterval(that.requestValUpdate.bind(that), that.defn.subscribeIntvl, that.defn.subscribeMsg, null);
  }

};

//Port creation
// OscDeviceNode.prototype.makePorts = function(defn)
// {
//   for (var address in defn.addresses)
//   {
//     portsByAddress[address] = [];
//     console.log("address: " + address);
//     for (var i = 0; i < defn.addresses[address].length; i++)
//     {
//       var port = defn.addresses[address];
//       console.log("defn.addresses[address]: " + defn.addresses[address]);
//       console.log("port: " + port);
//       portsByAddress[address].push(this.makePort(port, defn.outputs[port], ports.OutputPort));
//     }
//   }
// };


OscDeviceNode.prototype.makeAllPorts = function(defn)
{
  var that = this;
  bb.forEachObjKey(defn.outputs,that.makePort.bind(that),ports.OutputPort);
  if (!this.defn.raw)  {
    bb.forEachObjKey(defn.addresses,that.makeAddressPortBinding.bind(that));
  }
};

OscDeviceNode.prototype.destroy = function () {
  //nothing!
}

OscDeviceNode.prototype.makePort = function(name,params, portObj) {
  //console.log("Making port...");
  //console.log("PortObj" + portObj);
  this.ports[name] = new portObj(this, params);
  portList[this.ports[name].id] = this.ports[name];
  mapNodesByPortId[this.ports[name].id] = this;
  MapNode.addPortToList(this.ports[name]);
  return this.ports[name];
};

OscDeviceNode.prototype.makeAddressPortBinding = function(addr,argsToPorts) {
  this.portsByAddress[addr] = [];
  for (var p = 0; p < argsToPorts.length ; p ++) {
    this.portsByAddress[addr].push(this.ports[argsToPorts[p]]);
  }
}

//Networking stuff

// OscDeviceNode.prototype.requestUpdate = function()
// //Request an update from the device
// {
// 	for (var address in portsByAddress)
// 	{
//     //console.log(address);
// 		var buf = osc.toBuffer({address: address, args:[]});
// 		this.out_socket.send(buf, 0, buf.length, this.port, this.ip);
// 	}
// };

OscDeviceNode.prototype.requestValUpdate = function(address, args){
  //Request update for a particular value in the device
  this.updateNum++;
  //console.log("Update Requested " + this.updateNum);
  var buf = osc.toBuffer({address: address, args:args});
  this.recv_socket.send(buf, 0, buf.length, this.recv_port, this.ip);
};

OscDeviceNode.prototype.parseMsg = function(osc_msg)
//parses an OSC msg and changes the state accordingly
{
	if (this.defn.raw) {
    this.ports.raw.set(osc_msg);
    return;
  }


  //console.log("Parsing Message");
	var msg = osc.fromBuffer(osc_msg);
  //console.log("OSC Message Below:");
  //console.log(msg);
  //l.debug("---- PORT INFO")
  //l.debug(portsByAddress[msg.address]);

  var ports = this.portsByAddress[msg.address];

  if (ports) {
    for (var i = 0; i < ports.length; i++) {
      ports[i].set(msg.args[i].value);
    }
  }

  //Request update of value
  //setTimeout(this.requestValUpdate.bind(this), 30, msg.address, []);

};



// OscDeviceNode.prototype.watchdog = function(){
//   //Checks if there has been any update to the number of packets received

//   //console.log("Watchdog check");

//   if (this.watchdogCount == this.receivedNum)
//   {
//     // clearInterval(this.watchdogObj);
//     // console.log("Watchdog cycle halted");
//     this.requestUpdate();
//     //console.log("A packet has been lost!");
//     //setTimeout(function(){this.watchdogObj = setInterval(this.watchdog.bind(this), watchdogCheckTime); console.log("Watchdog continues");}, 2000); //restart the watchdog cycle in 1 second
//   }
//   else
//   {
//     this.watchdogCount = this.receivedNum;
//   }
// };

//Node stuff



OscDeviceNode.getMapNodeById = function(id) {
  return nodeList[id];
};

OscDeviceNode.getMapNodeByPortId = function(id) {
  return mapNodesByPortId[id];
};

OscDeviceNode.getPortById = function(id) {
  return portList[id];
};

OscDeviceNode.prototype.getId = function() {
  return this.id;
};

OscDeviceNode.prototype.getPorts = function() {
  var ports = {inputs:{}, outputs:{}};
  bb.forEachObjKey(this.ports, function(k,v) {
    if (v.direction == PortDirection.INPUT) {
      ports.inputs[k]=v.id;
    } else  {
      ports.outputs[k]=v.id;
    }
  });
  return ports;
};

OscDeviceNode.prototype.serialize = function() {
  var p = this.getPorts()
  return {
    nodetype: this.defn.nodetype,
    descr: this.defn.descr,
    deviceType: this.defn.deviceType,
    x: this.x,
    y: this.y,
    id: this.id,
    inputs: p.inputs,
    outputs: p.outputs,
    nodeName: this.nodeName
  };
};

module.exports = OscDeviceNode;