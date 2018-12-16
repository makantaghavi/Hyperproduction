//Test to see if OSC successfully generalized

var OscReceiveNode = require('./OscReceiveNode_generalized.js');
var OscSendNode = require('./OscSendNode_generalized.js');
var ODM = require('./OscDeviceModules.js');
var ComputeModules = require("./ComputeModules.js");
var ContainerMapNode = require("./ContainerMapNode.js");


myMapping = new ContainerMapNode();

var myReceiveNode = new OscReceiveNode("receiver",'18.85.52.46', 10023, ODM.X32ReceiveNode);
var mySendNode = new OscSendNode("sender", '18.85.52.46', 10023, ODM.X32SendNode);

myMapping.createDeviceNode(myReceiveNode);
myMapping.createDeviceNode(mySendNode);
myMapping.createNode(ComputeModules.AddOperation2i1o,"adder");

//Create the connections
myMapping.connectByNodeIdPortName("receiver", "o1", "adder", "i1");
myMapping.connectByNodeIdPortName("receiver", "o2", "adder", "i2");
myMapping.connectByNodeIdPortName("receiver", "o3", "sender", "i2");
myMapping.connectByNodeIdPortName("adder", "o1", "sender", "i1");

myReceiveNode.requestUpdate();
var repl = require("repl"),
    msg = "message";

repl.start({prompt: "> ", useGlobal: true}).context.m = msg;