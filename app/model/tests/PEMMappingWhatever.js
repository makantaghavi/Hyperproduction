var ContainerMapNode = require("../ContainerMapNode.js");
var ComputeModules = require("../ComputeModules.js");
var l = require("../log.js");
var bb = require("../benb_utils.js");

var OscReceiveNode = require('../OscReceiveNode.js');
var OscSendNode = require('../OscSendNode.js');
var ODM = require('../OscDeviceModules.js');
var Type = require('../ports.js').Type;

var myMapping = new ContainerMapNode();


var CustomOSCInput = {
	nodetype: "Receive",
	descr: "Custom data mappings for OSC input and output",
	addresses: {
		"/1/rms" : ["rms"]
	},
	outputs: {
		rms: {type: Type.FLOAT, defaultValue: 0.0}
	}
}

var CustomOSCOutput = {
	nodetype: "Receive",
	descr: "Custom data mappings for OSC input and output",
	addresses: {
		"/channel/complexity" : ["rms"]
	},
	inputs: {
		rms: {type: Type.ANY, defaultValue: 0.0}
	}
}

var customRcv = new OscReceiveNode("customRcv", CustomOSCInput, 9090);
myMapping.createDeviceNode(customRcv);

var customSnd = new OscSendNode("customSnd","192.168.1.137", 4662, CustomOSCOutput);
myMapping.createDeviceNode(customSnd);

var osculatorSend = new OscSendNode("osculator", "127.0.0.1", 7100, ODM.OsculatorPlotter);
myMapping.createDeviceNode(osculatorSend);

myMapping.createNode(ComputeModules.DataStreamAnalyzer, "RMS-Analyzer");

myMapping.connectByNodeIdPortName("customRcv", "rms", "RMS-Analyzer", "dataInput");
myMapping.connectByNodeIdPortName("RMS-Analyzer", "mean", "osculator", "i1");
myMapping.connectByNodeIdPortName("RMS-Analyzer", "mean", "customSnd", "rms");

