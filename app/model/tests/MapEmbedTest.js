var ContainerMapNode = require("./ContainerMapNode.js");
var ComputeModules = require("./ComputeModules.js");
var l = require("./log.js");
var bb = require("./benb_utils.js");

var myMapping = new ContainerMapNode();

//console.log(myMapping.defn);

var add1 = myMapping.createNode(ComputeModules.AddOperation2i1o);
var inlet1 = myMapping.createNode(ComputeModules.Inlet);
var inlet2 = myMapping.createNode(ComputeModules.Inlet);
var outlet1 = myMapping.createNode(ComputeModules.Outlet);

//console.log(myMapping.ports);


myMapping.connectByNodeIdPortName(inlet1, "o1", add1, "i1");
myMapping.connectByNodeIdPortName(inlet2, "o1", add1, "i2");
myMapping.connectByNodeIdPortName(add1, "o1", outlet1, "i1");


myMapping.createContainerMapNode(myMapping.getFullMapping());

newMapping = new ContainerMapNode(myMapping.getFullMapping());

l.debug(JSON.stringify(newMapping.getFullMapping(), undefined, 2));
