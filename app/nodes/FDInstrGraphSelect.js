var Type = require("hp/model/ports").Type;
var RunningState = require("hp/model/MapNode").RunningState;
module.exports.FDInstrGraphSelect = (function () {return {nodetype:"FDInstrGraphSelect",path: __filename,deprecated: true,inputs:{bass:{type: Type.FLOAT, defaultValue: 0.0},cello:{type: Type.FLOAT, defaultValue: 0.0},keys:{type: Type.FLOAT, defaultValue: 0.0},perc:{type: Type.FLOAT, defaultValue: 0.0},select:{type: Type.FLOAT, defaultValue: 0.0},vln1:{type: Type.FLOAT, defaultValue: 0.0},vln2:{type: Type.FLOAT, defaultValue: 0.0},tuba:{type: Type.FLOAT, defaultValue: 0.0},viola:{type: Type.FLOAT, defaultValue: 0.0},cl1:{type: Type.FLOAT, defaultValue: 0.0},cl2:{type: Type.FLOAT, defaultValue: 0.0},},outputs:{result:{type: Type.FLOAT, defaultValue: 0.0},},procfn:function (ports, state, id, triggerPort) {
    if (triggerPort.name === ports.select.get()) {
      ports.result.set(triggerPort.get());
    }
  },};})();