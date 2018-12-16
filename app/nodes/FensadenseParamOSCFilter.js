var Type = require("hp/model/ports").Type;
var RunningState = require("hp/model/MapNode").RunningState;
module.exports.FensadenseParamOSCFilter = (function () {return {nodetype:"FensadenseParamOSCFilter",deprecated:true,inputs:{bufIn:{type: "BUF", defaultValue: null, fixed: false},oscIn:{type: "OBJECT", defaultValue: 0, fixed: false},},outputs:{bufOut:{type: "BUF", defaultValue: 0, fixed: false},_myo_acc_left:{type: "ANY", defaultValue: 0, fixed: false},_myo_acc_right:{type: "ANY", defaultValue: 0, fixed: false},_myo_quat_left:{type: "ANY", defaultValue: 0, fixed: false},_myo_quat_right:{type: "ANY", defaultValue: 0, fixed: false},_myo_ypr_right:{type: "ANY", defaultValue: 0, fixed: false},_myo_ypr_left:{type: "ANY", defaultValue: 0, fixed: false},_myo_emg_left:{type: "ANY", defaultValue: 0, fixed: false},_myo_emg_right:{type: "ANY", defaultValue: 0, fixed: false},},procfn:function (ports, state, id, triggerPort) {
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
        ports[prefix].set({address: msg.address.substr(prefix.length), args: msg.args });
        break;
      }
    }
  },};})();