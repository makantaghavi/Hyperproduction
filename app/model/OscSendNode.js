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
var mapNodesByPortId = {};

//var outputsDef = {o1: {type: Type.INT, defaultValue : 0, address: "/ch/01/mix/fader"}};
//var outputsDef = {
//    o1: { type : Type.INT, defaultValue : 0 }
//  };

//console.log("Objlen!! "+Object.keys(outputsDef).length);

var OscDeviceNode = function(id, defn,  port, ip_address, x, y, out_socket, recv_socket ) {

  console.log("Creating OSC Device");

  var that = this;
  this.id = (id == null) ? bb.uuid() : id;
  this.ports = {};
  this.nodeState = null;
  this.portsByAddress = {};
  this.defn = defn;
  this.x = x || 0;
  this.y = y || 0;

  //Setup output ports
  console.log("Printing output port");
  console.log(ports.OutputPort);

  this.makeAllPorts(this.defn); //Make all the needed ports

  nodeList[this.id] = this;

  this.ip = ip_address;
  this.port = port; //Port device receives data on

  if (typeof recv_socket == 'undefined') {
  	this.recv_socket = udp.createSocket("udp4", function(msg, rinfo){
  		//try
  		//{
  			that.parseMsg(msg);
  		//}
  		/*catch(error)
  		{
  			return console.log("invalid packet received");
  		}
      */
  	});
  }
  else
  	this.recv_socket = recv_socket;
  if (typeof out_socket == 'undefined')
  	this.out_socket = this.recv_socket;
  else
  	this.out_socket = out_socket; //Out_socket is socket data is sent out of
};


getType = function(value){
	//Returns the osc string type of a value
	if (typeof value == "string")
		return 'string';
	if (value % 1 === 0)
		return 'integer';
	return 'float';

//typeof ports is set weird, DISCUSS WITH BEN
};


//Port creation
// OscDeviceNode.prototype.makePorts = function(defn)
// {
//   for (var address in defn.addresses)
//     {
//       portsByAddress[address] = [];
//       console.log("address: " + address);
//       var portList = defn.addresses[address];
//       for (var i = 0; i < portList.length; i++)
//       {
//         var port = portList[i];
//         console.log("defn.addresses[address]: " + defn.addresses[address]);
//         console.log("port: " + port);
//         portsByAddress[address].push(this.makePort(port, defn.inputs[port], ports.InputPort));
//       }
//     }
// };

OscDeviceNode.prototype.makeAllPorts = function(defn)
{
  var that = this;
  bb.forEachObjKey(defn.inputs,that.makePort.bind(that),ports.InputPort);
  if (!this.defn.raw) {
    bb.forEachObjKey(defn.addresses,that.makeAddressPortBinding.bind(that));
  }
};

OscDeviceNode.prototype.destroy = function () {
  //nothing!
}


OscDeviceNode.prototype.makePort = function(name,params, portObj) {
  //console.log("Making port...");
  //console.log("PortObj" + portObj);
  //console.log(params.address);
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

OscDeviceNode.prototype.sendUpdate = function()
//Update the device with the current node state
{
	for (var address in this.portsByAddress)
	{
    var oscArgs = [];
    var nodeInputPortsForAddr = this.portsByAddress[address];


    // console.log("Ports By Address");
    // console.log(portsByAddress);


    //console.log("Port list: ");
    //console.log(portList);
    for (var i = 0; i < nodeInputPortsForAddr.length; i++)
    {
      //console.log("Particular port: ");
      //console.log(portList[i]);
      var value = nodeInputPortsForAddr[i].get();
      console.log({type: getType(value), value: value});
      oscArgs.push({type: getType(value), value: value});
    }
    //console.log("Args: ");
    //console.log(oscArgs);
	var buf = osc.toBuffer({
		address: address,
		args: oscArgs
	});
	this.out_socket.send(buf, 0, buf.length, this.port, this.ip);
	}
};

OscDeviceNode.prototype.process = function()
{
  //console.log("Update sent");
  if (this.defn.raw) {
    buf = this.ports.raw.get();
    this.out_socket.send(buf, 0, buf.length, this.port, this.ip);
    return;
  }

	this.sendUpdate();
};

//Node stuff

OscDeviceNode.getMapNodeById = function(id) {
  return nodeList[id];
};

OscDeviceNode.prototype.getId = function() {
  return this.id;
};

OscDeviceNode.getMapNodeByPortId = function(id) {
  return mapNodesByPortId[id];
};

OscDeviceNode.getPortById = function(id) {
  return portList[id];
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