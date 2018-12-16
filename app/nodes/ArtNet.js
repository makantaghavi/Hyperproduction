var Type = require("hp/model/ports").Type;
var MathUtil = require("hp/lib/ptlib/util/MathUtil");
var artNet = require("artnet");

//var ARTNET_OPTIONS = {
//  host: "10.100.1.200",
//  port: 6454,
//  refresh: 4000 // Frequency to resent state when there are no changes
//};
// FIXME: Because this node depends on the artnet library, it cannot be edited and, therefore, cannot be variadic.
exports.ArtNetChannelLevels = {
  nodetype: "ArtNetChannelLevels",
  descr: "Sets the level for numerically indexed channel.",
  path: __filename,
  inputs: {
    "host": {type: Type.STRING, defaultValue: "127.0.0.1", fixed: true},
    "universe": {type: Type.INT, defaultValue: 0, fixed: true},
    "1": {type: Type.FLOAT, defaultValue: 0},
    "2": {type: Type.FLOAT, defaultValue: 0},
    "3": {type: Type.FLOAT, defaultValue: 0},
    "4": {type: Type.FLOAT, defaultValue: 0}
  },
  outputs: {
  },
  initFn: function (ports, state, name, emt) {
    // jshint newcap:false
    state.artNet = artNet({
      host: ports.host.get(),
      port: 6454,
      refresh: 4000 // Frequency to resend state when there are no changes
    });
    state.data = new Array(512);
    state.changed = false;
  },
  procfn: function (ports, state, id, triggerPort) {
    if (triggerPort === ports.host) {
      state.artNet.setHost(ports.host.get());
    }
    else if (!triggerPort.fixed) {
      state.data[Number.parseInt(triggerPort.name, 10)] = MathUtil.clip(triggerPort.get() * 255, 0, 255);
      state.changed = true;
    }
  },
  tick: function (ports, state) {
//    var port;
//    for (var p in ports) {
//      port = ports[p];
//      if (!port.fixed) {
//        state.artNet.set(ports.universe.get(), Number.parseInt(port.name, 10), MathUtil.clip(port.get() * 255, 0, 255));
//      }
//    }
    if (state.changed) {
      state.artNet.set(ports.universe.get(), 1, state.data);
      state.changed = false;
    }
  },
  variadicInput: true
};
