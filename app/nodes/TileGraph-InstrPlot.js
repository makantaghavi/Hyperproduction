var Type = require("hp/model/ports").Type;
var RunningState = require("hp/model/MapNode").RunningState;
module.exports.TileGraphInstrPlot = (function () {return {nodetype:"TileGraphInstrPlot",path: __filename,inputs:{leftAcc:{type: Type.FLOAT, defaultValue: 0.0},rightAcc:{type: Type.FLOAT, defaultValue: 0.0},leftRPY:{type: Type.FLOAT, defaultValue: 0.0},rightRPY:{type: Type.FLOAT, defaultValue: 0.0},},outputs:{out:{type: Type.FLOAT, defaultValue: 0.0},},
deprecated: true,
procfn:function (ports, state, id, triggerPort, emitter) {
//    if (emitter) {
//      emitter.emit('graph-update', 'graph-update', {
//        "action": "graph-update",
//        "id" : id,
//        "graph": triggerPort.name,
//        "data" : triggerPort.get()
//      });
//    }
//    return state;
    state.data[triggerPort.name] = {graph: triggerPort.name, data: triggerPort.get()};
  },tick:function (ports, state, id, tickData, defn) {
    if (defn.emitter) {
      defn.emitter.emit('graph-update', 'graph-update', {
        "action": "graph-update",
        "id": id,
        "data": state.data
      });
    }
  },initFn:function (ports, state, id) {
    state.data = {};
  },uiDefn:"hp/client/PanelTileGraphNode"};})();