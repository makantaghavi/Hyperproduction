var Type = require("../model/ports").Type;
var RunningState = require("../model/MapNode").RunningState;
module.exports.ReaperSendCtrlOSC = (function () {
  return {nodetype:"ReaperSendCtrlOSC",
  inputs:{
    sendHost:{type: Type.STRING, defaultValue: "127.0.0.1", fixed: false, continuous: true, published: true},
    sendPort:{type: Type.INT, defaultValue: 8000, fixed: false, continuous: true, published: true},
    ctrlNum:{type: Type.INT, defaultValue: 1, fixed: false, continuous: true},
    ctrlVal:{type: Type.INT, defaultValue: 0, fixed: false, continuous: true},
  },
  outputs:{},
  procfn:function (ports, state, id, triggerPort) {
    var that = this;
    switch (triggerPort.name) {
      case "ctrlVal":
        var addr = "i/vkb_midi/cc/" + ports.ctrlNum.get();
        var buf = osc.toBuffer({address: addr, args: [ports.ctrlVal.get()]})
        state.sock.send(buf, 0, buf.length, ports.sendPort.get(), ports.sendHost.get());
        break;
      case "ctrlNum":
        /* falls through */
      case "sendHost":
        /* falls through */
      case "sendPort":
        /* falls through */
      default:
        break;
    }
  },initFn:function (ports,state,name,emt) {
    var that = this;
    state.pktCount = 0;
    state.addrStringLookup = {};
    state.lastPktTime = null;
    state.sock = udp.createSocket("udp4", function(msg,rinfo) {
      that.parseMsg(ports,msg);
      state.pktCount++;
      var now = Date.now();
      if (state.lastPktTime === null) {
            state.lastPktTime = now;
            return;
      }
      ports.pktTime.set((now - state.lastPktTime)/1000);
      state.lastPktTime = now;
    });
  },};})();