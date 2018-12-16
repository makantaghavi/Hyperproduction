//Test Ben's Nodes Backend with Networking
var ContainerMapNode = require("../hpexperiments/ContainerMapNode.js");
var ComputeModules = require("../hpexperiments/ComputeModules.js");

var myMapping = new ContainerMapNode();

var fader1 = myMapping.createNode(ComputeModules.Inlet);
var fader2 = myMapping.createNode(ComputeModules.Inlet);

var fader3 = myMapping.createNode(ComputeModules.Outlet);
