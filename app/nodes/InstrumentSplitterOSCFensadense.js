var Type = require("hp/model/ports").Type;
var RunningState = require("hp/model/MapNode").RunningState;
module.exports.InstrumentSplitterOSCFensadense = (function () {return {nodetype:"InstrumentSplitterOSCFensadense",deprecated:true,path: __filename,inputs:{bufIn:{type: Type.FLOAT, defaultValue: 0.0},oscIn:{type: Type.FLOAT, defaultValue: 0.0},},outputs:{_horae_time:{type: Type.FLOAT, defaultValue: 0.0},bufOut:{type: Type.FLOAT, defaultValue: 0.0},_vln1:{type: Type.FLOAT, defaultValue: 0.0},_vln2:{type: Type.FLOAT, defaultValue: 0.0},_viola:{type: Type.FLOAT, defaultValue: 0.0},_cello:{type: Type.FLOAT, defaultValue: 0.0},_perc:{type: Type.FLOAT, defaultValue: 0.0},_keys:{type: Type.FLOAT, defaultValue: 0.0},_tuba:{type: Type.FLOAT, defaultValue: 0.0},_cl1:{type: Type.FLOAT, defaultValue: 0.0},_cl2:{type: Type.FLOAT, defaultValue: 0.0},_bass:{type: Type.FLOAT, defaultValue: 0.0},},procfn:function (ports, state, id, triggerPort) {
    var msg;
    if (triggerPort.name === "bufIn") {
//      try {
        msg = osc.fromBuffer(ports.bufIn.get());
//      }
//      catch (e) {
//        console.log(e);
//      }
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