var Type = require("hp/model/ports").Type;

exports.QLabCue = {
  nodetype: "QLabCue",
  descr: "Creates an OSC message to send the given cue \"number\" to QLab.",
  path: __filename,
  inputs: {
    cueNumber: {type: Type.STRING, defaultValue: 0}
  },
  outputs: {
    qlabOSC: {type: Type.OBJECT, defaultValue: {}}
  },
  procfn: function (ports, state, id, triggerPort) {
    if (triggerPort === ports.cueNumber) {
      ports.qlabOSC.set({address: `/cue/${triggerPort.get()}/start`, arguments: [1]});
    }
  }
};

