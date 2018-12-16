/* Duplicate functionality of Merge and Interleave 
var Type = require("hp/model/ports").Type;
var RunningState = require("hp/model/MapNode").RunningState;
module.exports.StreamMerger = {
  nodetype: "StreamMerger",
  path: __filename,
  inputs: {
  },
  outputs: {
    out: {type: Type.OBJECT, defaultValue: {}},
  },
  procfn:function (ports, state, id, triggerPort) {
    if (triggerPort.name != "out") {
        console.log(triggerPort.name);
        ports.out.set(triggerPort.get());
    }
  },
};
*/

module.exports.StreamMerger = require("hp/nodes/BaseModules").Merge;