var ContainerMapNode = require("./ContainerMapNode.js");
var ComputeModules = require("./ComputeModules.js");
var l = require("./log.js");
var bb = require("./benb_utils.js");

for (var h = 1; h < 11; h++) {
    var myMapping = new ContainerMapNode();
    
    var triangle_height = h, total_nodes = Math.pow(2,triangle_height);
    console.log("------------------------------")
    console.log("Height "+h+" Total nodes: "+total_nodes);
    
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
    
    //console.log(JSON.stringify(myMapping.getFullMapping(), undefined, 2));
    
    //console.log(JSON.stringify(myMapping.getCytoscapeElements()));
    
    l.profile("1000 adds");
    for (var c = 0; c < 1000; c++) {
    
      //l.profile("single add")
      for (var i = total_nodes-1; i >= total_nodes/2; i--) {
        myMapping.setValueByNodeIdPortName(i-1,"i1",c);
        myMapping.setValueByNodeIdPortName(i-1,"i2",c);
      }
      var total = myMapping.getValueByNodeIdPortName(0,"o1");
    
    
      //console.log(total);
      if ( total != total_nodes*c ) {
        console.log("Ack something went wrong! "+total)
        break;
      }
    
      //l.profile("single add")
    
      //l.info(myMapping.getValueByNodeIdPortName("counter","o1"));
    
    
    }
    l.profile("1000 adds");

}
