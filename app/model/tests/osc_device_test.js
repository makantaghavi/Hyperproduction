#!/usr/local/bin/node

var ContainerMapNode = require("./ContainerMapNode.js");
var ComputeModules = require("./ComputeModules.js");
var OscReceiveNode = require("./OscReceiveNode.js");
var OscSendNode = require("./OscSendNode.js");
var ports = require("./ports.js");
var l = require("./log.js");

myMapping = new ContainerMapNode();

//Two faders matching

// myReceiveNode = new OscReceiveNode("a", '18.85.52.46', 10023, "/ch/01/mix/fader");
// mySendNode = new OscSendNode("b", '18.85.52.46', 10023, "/ch/02/mix/fader");

// myMapping.createDeviceNode(myReceiveNode);
// myMapping.createDeviceNode(mySendNode);

// myMapping.connectByNodeIdPortName("a","o1","b","i1");

// Adder stuff
var myReceiveNode2 = new OscReceiveNode("c", '18.85.52.46', 10023, "/ch/03/mix/fader");
var myReceiveNode3 = new OscReceiveNode("d", '18.85.52.46', 10023, "/ch/04/mix/fader");
var mySendNode2 = new OscSendNode("e", '18.85.52.46', 10023, "/ch/05/mix/fader");

myMapping.createDeviceNode(myReceiveNode2);
myMapping.createDeviceNode(myReceiveNode3);
myMapping.createDeviceNode(mySendNode2);
myMapping.createNode(ComputeModules.AddOperation2i1o,"f");

myMapping.connectByNodeIdPortName("c","o1","f","i1");
myMapping.connectByNodeIdPortName("d","o1","f","i2");
myMapping.connectByNodeIdPortName("f","o1","e","i1");



l.debug(myMapping.getFullMapping());

//setInterval(function(){myReceiveNode.requestUpdate();console.log(myMapping.getValueByNodeIdPortName("b","i1"));}, 100);

myReceiveNode2.requestUpdate();
var repl = require("repl"),
    msg = "message";

repl.start({prompt: "> ", useGlobal: true}).context.m = msg;