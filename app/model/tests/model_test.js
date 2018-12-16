#!/usr/local/bin/node
var l = require("./log.js");
var ContainerMapNode = require("./ContainerMapNode.js");
var ComputeModules = require("./ComputeModules.js");

var myMapping = new ContainerMapNode();

var tmpid = myMapping.createNode(ComputeModules.IdentityOperation2i2o,"a");
var tmpid = myMapping.createNode(ComputeModules.IdentityOperation2i2o,"b");
var tmpid = myMapping.connectByNodeIdPortName("a","o1","b","i1");
l.debug(myMapping.getFullMapping());
var tmpid = myMapping.setValueByNodeIdPortName("a","i1",5);
var tmpid = myMapping.setValueByNodeIdPortName("a","i2",2);

var printOutput = function() {
  l.debug(myMapping.getValueByNodeIdPortName("b","o1"));
};

//setTimeout(printOutput,1000);
printOutput();


//var blah = new MapNode(ComputeModules.AddOperation2i1o)
