var ContainerMapNode = require("../ContainerMapNode.js");
var ComputeModules = require("../ComputeModules.js");
var l = require("../log.js");
var bb = require("../benb_utils.js");

var OscReceiveNode = require('../OscReceiveNode.js');
var OscSendNode = require('../OscSendNode.js');
var ODM = require('../OscDeviceModules.js');
var Type = require('../ports.js').Type;

var CustomOSCInput = {
	nodetype: "Receive",
	descr: "Custom data mappings for OSC input and output",
	addresses: {
		"/myhappy/input" : ["aPortIn"]
	},
	outputs: {
		aPortIn: {type: Type.ANY, defaultValue: 0.0}
	}
}

var CustomOSCOutput = {
	nodetype: "Receive",
	descr: "Custom data mappings for OSC input and output",
	addresses: {
		"/composition/link1/values" : ["link1"]
	},
	inputs: {
		link1: {type: Type.ANY, defaultValue: 0.0}
	}
}
    
var myMapping = new ContainerMapNode();

myMapping.createNode(ComputeModules.DataStreamAnalyzer, "Glover-PitchL-Analyzer");
myMapping.createNode(ComputeModules.Inlet);
myMapping.createNode(ComputeModules.ConsoleLogger, "Log-pitchL");
myMapping.createNode(ComputeModules.ConsoleLogger, "Log-scaledOutput");
myMapping.createNode(ComputeModules.Threshold, "threshold");
myMapping.createNode(ComputeModules.Impulse, "impulse");
myMapping.createNode(ComputeModules.Normalizer, "normalizer");
myMapping.createNode(ComputeModules.Envelope, "env");

var gloverReceive = new OscReceiveNode("glover", ODM.GloverSerial, 8080);
myMapping.createDeviceNode(gloverReceive);

var customRecv = new OscReceiveNode("customRcv", CustomOSCInput, 9090);
myMapping.createDeviceNode(customRecv);

var customSend = new OscSendNode("customSnd","192.168.3.31", 7000, CustomOSCOutput);
myMapping.createDeviceNode(customSend);

var osculatorSend = new OscSendNode("osculator", "192.168.3.31", 7100, ODM.OsculatorPlotter);
myMapping.createDeviceNode(osculatorSend);

//myMapping.connectByNodeIdPortName("glover", "pitchL", "Log-pitchL", "logInput");
myMapping.connectByNodeIdPortName("glover", "pitchL", "Glover-PitchL-Analyzer", "dataInput");
//myMapping.connectByNodeIdPortName("Glover-PitchL-Analyzer", "scaledOutput", "Log-scaledOutput", "logInput");
myMapping.connectByNodeIdPortName("Glover-PitchL-Analyzer", "scaledOutput", "osculator", "i1");
myMapping.connectByNodeIdPortName("Glover-PitchL-Analyzer", "mean", "osculator", "i2");
myMapping.connectByNodeIdPortName("Glover-PitchL-Analyzer", "dxOutput", "osculator", "i3");
myMapping.connectByNodeIdPortName("Glover-PitchL-Analyzer", "ixOutput", "osculator", "i4");


myMapping.connectByNodeIdPortName("Glover-PitchL-Analyzer", "scaledOutput", "threshold", "dataInput");
myMapping.connectByNodeIdPortName("Glover-PitchL-Analyzer", "scaledOutput", "impulse", "dataInput");

myMapping.connectByNodeIdPortName("threshold", "overThreshold", "osculator","i5");
myMapping.connectByNodeIdPortName("impulse", "dataOutput", "osculator","i6");
myMapping.connectByNodeIdPortName("Glover-PitchL-Analyzer", "variance", "normalizer", "dataInput");
myMapping.connectByNodeIdPortName("normalizer", "scaledOutput", "osculator", "i7");

//myMapping.connectByNodeIdPortName("glover", "peak", "Glover-PitchL-Analyzer", "dataInput");

myMapping.connectByNodeIdPortName("threshold", "overThreshold", "env","dataInput");
myMapping.connectByNodeIdPortName("env", "dataOutput", "osculator", "i8");
//myMapping.connectByNodeIdPortName("env", "dataOutput", "Log-scaledOutput", "logInput");


myMapping.connectByNodeIdPortName("Glover-PitchL-Analyzer", "mean", "customSnd", "link1");


var repl = require("repl"),
    msg  = "message";

repl.start({prompt: "> ", useGlobal: true}).context.m = msg;