var ContainerMapNode = require("hp/model/ContainerMapNode.js");
var ComputeModules = require("hp/model/ComputeModules.js");
ComputeModules = ComputeModules.getInstance();

var l = require("hp/model/log.js");
var bb = require("hp/model/benb_utils.js");

var c = new ContainerMapNode();


var stupid = function () {
	c.createNode("Blender", 'blender');
	//console.log(c.serialize())
	//console.log("===========");
	var blender = c.getMapNodes()['blender'];
	//console.log(blender);
	

	blender.defn.addCue(blender.nodeState, "Cue1");
	blender.defn.addInput(blender.nodeState, "blendy1");
	blender.defn.addOutput(blender.nodeState, "blendy2"); 
	blender.defn.addCue(blender.nodeState, "Cue2");


	l.debug(blender.nodeState.containerList.serialize());


}
setTimeout(stupid, 1000);

