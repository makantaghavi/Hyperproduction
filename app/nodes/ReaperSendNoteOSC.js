var Type = require("../model/ports").Type;
var RunningState = require("../model/MapNode").RunningState;
module.exports.ReaperSendNoteOSC = (function () {
  return {nodetype:"ReaperSendNoteOSC",
  inputs:{
    sendHost:{type: Type.STRING, defaultValue: "127.0.0.1", fixed: false, continuous: true, published: true},
    sendPort:{type: Type.INT, defaultValue: 8000, fixed: false, continuous: true, published: true},
    isKeyDown:{type: Type.BOOL, defaultValue: false, fixed: false, continuous: true},
    noteNum:{type: Type.INT, defaultValue: 60, fixed: false, continuous: true},
    noteVel:{type: Type.INT, defaultValue: 127, fixed: false, continuous: true},
  },
  outputs:{},
  procfn:function (ports, state, id, triggerPort) {
    var that = this;
    switch (triggerPort.name) {
      case "isKeyDown":
        var addr = "i/vkb_midi/note/" + ports.noteNum.get();
        var buf = osc.toBuffer({address: addr, args: [ports.isKeyDown.get() ? ports.noteVel.get() : 0]});
        state.sock.send(buf, 0, buf.length, ports.sendPort.get(), ports.sendHost.get());
        break;
      case "noteNum":
        /* falls through */
      case "noteVel":
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