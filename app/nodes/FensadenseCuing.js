var Type = require("hp/model/ports").Type;
var MathUtil = require("hp/lib/ptlib/util/MathUtil");

var TRIGGER_LUT = {
  
};

exports.FdTriggers = {
  nodetype: "FdTriggers",
  descr: "Maps MIDI triggers to preset numbers.",
  path: __filename,
  deprecated: true,
  inputs: {
    trigger: {type: Type.INT, defaulValue: 0}
  },
  outputs: {
    preset: {type: Type.INT, defaultValue: 0}
  },
  initFn: function (ports, state) {
    state.lut = TRIGGER_LUT;
  },
  procfn: function (ports, state, id, triggerPort) {
    var trigger = triggerPort.get();
    if (state.lut.hasOwnProperty(trigger)) {
      ports.preset.set(state.lut[trigger]);
    }w
  }
};
