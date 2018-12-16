var Type = require("hp/model/ports").Type;
var MathUtil = require("hp/lib/ptlib/util/MathUtil");

exports.Faders = {
  nodetype: "Faders",
  descr: "For each output port, output the values of a fader UI for that port.",
  path: __filename,
  initFn: function (ports, state, id, emitter) {
//    if (emitter) {
//      emitter.emit('node-ui-config', 'node-ui-config', {
//        "action": "node-ui-config",
//        "id": id,
//        "ports": ports
//      });
//    }
    state.handler = function (evtType, refcon) {
      if (refcon.id === state.id && ports[refcon.port]) {
        ports[refcon.port].set(refcon.data);
      }
    };
    // ipc.on('widget-slider-slide', state.handler);
  },
  destroy: function (ports, state) {
    // ipc.removeListener("widget-slider-slide", state.handler);
  },
  procfn: function (ports, state, id, triggerPort, emitter) {
    if (emitter) {
//      emitter.emit('node-ui-config', 'node-ui-config', {
//        "action": "node-ui-config",
//        "id": id,
//        "port": triggerPort.name,
//        "data": triggerPort.get()
//      });
    }
  },
  inputs: {},
  outputs: {
    fader1: {type: Type.ZEROTOONE, defaultValue: 0},
    fader2: {type: Type.ZEROTOONE, defaultValue: 0},
    fader3: {type: Type.ZEROTOONE, defaultValue: 0},
  },
  uiDefn: "hp/client/PanelFadersNode",
  variadicOutput: true,
  emitter: true
};
