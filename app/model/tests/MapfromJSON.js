var ContainerMapNode = require("./ContainerMapNode.js");
var ComputeModules = require("./ComputeModules.js");
var l = require("./log.js");
var bb = require("./benb_utils.js");

var myMapping = new ContainerMapNode();

var triangle_height = 3, total_nodes = Math.pow(2,triangle_height);

var unconnectedInputs = []

for (var i = 0; i < total_nodes-1; i++) {
  var n = myMapping.createNode(ComputeModules.AddOperation2i1o,i);
  bb.forEachObjKey(myMapping.getPortsByMapNodeId(n).inputs, function(portName,portId) {
    unconnectedInputs.push(portId);
  });
  if ((unconnectedInputs.length > 0) && (i > 0)) {
    myMapping.connectByPortId(myMapping.getPortsByMapNodeId(n).outputs.o1, unconnectedInputs.shift());
  }
}

myMapping.createNode(ComputeModules.ProcessCounter,"counter");
myMapping.connectByNodeIdPortName(0,"o1","counter","i1");

console.log(myMapping.getFullMapping());

var jsonmap = JSON.stringify(myMapping.getFullMapping());

ContainerMapNode.buildFromJSON(jsonmap);
