var Type = require("hp/model/ports").Type;
var RunningState = require("hp/model/MapNode").RunningState;
module.exports.MyoOSCSplit = (function () {return {nodetype:"MyoOSCSplit",path: __filename,inputs:{bufIn:{type: Type.FLOAT, defaultValue: 0.0},oscIn:{type: Type.FLOAT, defaultValue: 0.0},},outputs:{bufOut:{type: Type.FLOAT, defaultValue: 0.0},_myo_acc:{type: Type.FLOAT, defaultValue: 0.0},_myo_quat:{type: Type.FLOAT, defaultValue: 0.0},},procfn:function (ports, state, id, triggerPort) {
    var msg;
    if (triggerPort.name === "bufIn") {
      msg = osc.fromBuffer(ports.bufIn.get());
    }
    else {
      msg = ports.oscIn.get();
    }
    var translated = msg.address.replace(/\//g,'_');
    //console.log("TRANSLATED", translated.startsWith);
    for (var prefix in ports) {

      if (translated.indexOf(prefix)==0) {
        // ports[prefix].set((msg.args.length === 1) ? msg.args[0].value : msg.args);
        ports[prefix].set({address: msg.address.substr(prefix.length), args: msg.args});
        break;
      }
    }
  },};})();