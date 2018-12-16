'use strict';

var Type = require("hp/model/ports").Type;
var ContainerMapNode = require("hp/model/ContainerMapNode");
var RunningState = require("hp/model/MapNode").RunningState;
var bb = require("hp/model/benb_utils")
var l = require("hp/model/log")

exports.Blender = {
  nodetype: "Blender",
  descr: "Computes a savory blend of child ContainerMapNodes.",
  path: __filename,
  initFn: function (ports, state) {
    state.containerList = new ContainerMapNode();
    state.containerList.on("mapping-changed", function (eventType, refcon) {
      if (refcon.container === state.containerList.id) {
        console.log("Blender got an update: ", eventType, refcon);
        // updatePorts(state, inputs, outputs, refcon)
      }
    });
  },
  procfn: function (ports, state) {
    state.coefficients = normalizeCoefs(ports.recipe.get());
  },
  inputs: {
    recipe: {
      type: Type.OBJECT,
      defaultValue: null
    }
  },
  outputs: {
    //cueIDList: {type: Type.ARRAY, defaultValue: null}
  },

	addCue: function (state,cueName) {
		_addContainer(state, cueName);

	},

	addInput: function (state, name) {
		_addInput(state, name);
	},

	addOutput: function (state, name) {
		_addOutput(state, name);
	}

};

function _addInput(state, inputName) {

  //Add inlet to master container
  var inletID = state.containerList.createNode("Inlet", inputName)


  //For each slave container, add inlet and hook master inlet to slave inlet
  bb.forEachObjKey(state.containerList.getMapNodes(), function(id, node) {
    console.log("NODE", node);
    if (node instanceof ContainerMapNode) { //Need to use instanceof here since this is not serialized
      var slaveInletID = node.createNode("Inlet", inputName + '-' + node.id); //node.id is CueName
      console.log("Creating connection", inletID, slaveInletID);
      state.containerList.connectByNodeIdPortName(inletID, 'o1', node.id, slaveInletID);
    }
    else if (node.defn.nodetype === "Interpolator") {
      //Don't need to touch interpolators for inputs
    }
  });
}

function _addOutput(state, outputName, type) {

	console.log("Interpolator", createInterpolator(state.containerList, type));

	var interpolator = state.containerList.createNode(createInterpolator(state.containerList, type), outputName+"-interpolator")

  //Add outlet to master container
  var outletID = state.containerList.createNode("Output", outputName);
  state.containerList.connectByNodeIdPortName(interpolator, 'output', outletID, 'i1');


  bb.forEachObjKey(state.containerList.getMapNodes(), function(id, node) {
    //For each container mapnode, add outlet, hook outlet
    if (node instanceof ContainerMapNode) {
      var slaveOutletID = node.createNode("Outlet", outputName+'-'+node.id); //node.id is CueName
      state.containerList.connectByNodeIdPortName(node.id, slaveOutletID, interpolator, node.id);
    }
    else if ( node.defn.nodetype === "Interpolator") {
      //Don't need to touch interpolators for inputs
    }
  });
}

function updatePorts(state, inputs, outputs, refcon) {
  // Find added or removed
  // Copy non-existent ports from refcon serialized into state.interpolate, inputs/outputs, and the children

  //is port changed input or output
}

/*

=if input (master inlet):
= add inlet to all slaves, with correct name

if output (master outlet)
- add interpolator with number of inputs = number of cues, input names set to cueIDs
- add outlet with appropriate name to all slaves
- add connection between new output of all slaves to input of interpolator, with cueIDs
- add master outlet, connect to interpolator output
- connect recipe to interpolator

Things we need:
= Generate container map nodes with specific inlets and outlets labeled correctly
+ Add inlets and outlets to slaves and master container map nodes, labeled correctly
= Generate interpolators with correct number of ports and labels
+ Add and remove ports to interpolators
= Interpolator which uses keys of recipe to combine input based on port name

*/

function _addContainer(state, containerCueID) {
  // // add all ports not already in dfn
  // generate the defn for current Inputs and Outputs

	state.containerList.createNode({nodetype: "ContainerMapNode"}, containerCueID);
	var cue = state.containerList.getMapNodes()[containerCueID];
	var children = state.containerList.getMapNodes();
	var iolet;
	//console.log("Children", children);

	//// Add a port to the interpolator for this cue.

	bb.forEachObjKey(children, function (id, node) {
		console.log("EL", node);
		if (node.defn && node.defn.nodetype === "Inlet") {
			iolet = cue.createNode("Inlet", node.nodeName + "-" + cue.id);
			state.containerList.connectByNodeIdPortName(node.id, "o1", cue.id, iolet);
		} else if (node.defn && node.defn.nodetype === "Outlet") {
			iolet = cue.createNode("Outlet", node.nodeName + "-" + cue.id);
			state.containerList.connectByNodeIdPortName(cue.id, iolet, node.id+"-interpolator", cue.id);
		}
	});

  // state.cueIDs[containerCueID] = thing

  // state.containerList[containerCueID] = new ContainerMapNode(defn);
}

function removeContainer(state, containerCueID) {
  state.containerList[containerCueID].destroy();
  delete state.containerList[containerCueID];
}

function normalizeCoefs(recipe) {

}

var InterpolatorFunctions = {
  htp: function (ports, state) {
    var coefs = state.coefficients;
    var highest = "";
    var max = Number.NEGATIVE_INFINITY;
    for (var coef in coefs) {
      if (coefs[coef] > max) {
        highest = coef;
        max = coefs[coef];
      }
    }
    return ports[coef].get();
  },
  linear: function (ports, state) {
    var acc = 0;
    var coefs = state.coefficients;
    for (var coef in coefs) {
      acc += coefs[coef] * ports[coef].get();
    }
    return acc;
  }
};

function interpolatorProcFnFactory(type) {
  switch (type) {
    case Type.FLOAT:
    case Type.NUM:
    case Type.ZEROTOONE:
      return InterpolatorFunctions.linear;
    case Type.OBJECT:
    case Type.BOOL:
      return InterpolatorFunctions.htp;
    case Type.ANY:
      /* fall through */
    default:
      return InterpolatorFunctions.htp;
  }
}

function createInterpolator(container, type) {
  type = type || Type.ANY;
  var defn = {
    nodetype: "Interpolator",
    descr: "Interpolates inputs based a recipe.",
    procfn: interpolatorProcFnFactory(type),
    inputs: {},
    outputs: {
      output: {
        "type": type,
        "defaultValue": 0
      }
    }
  };
  bb.forEachObjKey(container.getMapNodes(), function (key, el) {
    defn.inputs[key] = {
      "type": type,
      "defaultValue": 0
    };
  });
  return defn;
}

function createCueContainer(state) {
  var cc = new ContainerMapNode();

  return;
}
